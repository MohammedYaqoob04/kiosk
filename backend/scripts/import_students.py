"""Import students from the college's Excel sheet.

    python -m scripts.import_students path/to/students.xlsx --dry-run   # check only, writes nothing
    python -m scripts.import_students path/to/students.xlsx             # import

Rules
- ALL-OR-NOTHING: if any row has an error, nothing is written and every problem is listed.
- Only the columns in COLUMN_MAP are read. Aadhaar, religion, community, blood group, parents' names and
  phone numbers, and nationality are IGNORED on purpose: the kiosk never needs them, and storing them
  would only create risk. (Aadhaar numbers have special legal handling in India.)
- Login: username = register number (12 digits starting with 5104), first password = ddmm of the date of
  birth (INITIAL_PASSWORD_FORMAT in .env can switch to ddmmyyyy), and the student must change it at first login.
- Re-importing updates details but never resets a password, never removes a counsellor assignment, and
  never overwrites a section that was already assigned with an empty "NIL".
"""
from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path

import openpyxl
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.enums import Role
from app.models import Department, Student, User
from app.security import hash_password, initial_password

COLUMN_MAP = {
    "academic year": "academic_year", "academic pattern": "academic_pattern", "semester": "semester",
    "programme code": "programme_code", "name of the programme": "programme_name",
    "department": "department_code", "register number": "register_no", "regulation id": "regulation_id",
    "admission year": "admission_year", "name": "name", "date of birth": "dob", "gender": "gender",
    "section": "section", "batch": "batch", "whatsapp number": "mobile", "mobile number": "mobile",
    "e mail id": "email", "email id": "email", "email": "email", "address": "address",
    "city/village": "city", "district": "district", "pincode": "pincode", "state": "state",
}
REQUIRED = {"academic_year", "semester", "programme_code", "department_code", "register_no", "name", "dob", "batch"}
SENSITIVE_IGNORED = {"community", "religion", "nationality", "father name", "father's mobile number",
                     "mother name", "mother's mobile number", "aadhar card number", "aadhaar card number",
                     "blood group"}
EMPTY_SECTION = {"", "NIL", "NA", "N/A", "-", "NONE"}
YEARS = re.compile(r"^\d{4}-\d{4}$")
REG_NO = re.compile(r"^5104\d{8}$")  # same rule as the kiosk login screen
# The sheet writes the department as "AI&DS"; the kiosk uses the code "AIDS". Add more departments here.
DEPARTMENTS = {"AI&DS": ("AIDS", "Artificial Intelligence & Data Science"),
               "AIDS": ("AIDS", "Artificial Intelligence & Data Science")}


def norm_header(h) -> str:
    return re.sub(r"\s+", " ", str(h or "").strip().lower())


def text(v) -> str | None:
    if v is None:
        return None
    if isinstance(v, float) and v.is_integer():
        v = int(v)  # Excel stores 9000000001 as 9000000001.0
    s = re.sub(r"\s+", " ", str(v)).strip()
    return s or None


def parse_dob(v) -> date:
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    s = text(v)
    if not s:
        raise ValueError("date of birth is missing")
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    raise ValueError(f"date of birth '{s}' is not a date (use dd-mm-yyyy)")


@dataclass
class ParsedRow:
    row: int
    data: dict


@dataclass
class ImportReport:
    rows_read: int = 0
    created: int = 0
    updated: int = 0
    dry_run: bool = False
    errors: list[tuple[int, str]] = field(default_factory=list)
    warnings: list[tuple[int, str]] = field(default_factory=list)
    assigned: int = 0
    ignored_columns: list[str] = field(default_factory=list)
    sensitive_columns_ignored: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def _parse_row(row_no: int, raw: dict, report: ImportReport) -> dict | None:
    errs_before = len(report.errors)

    def err(msg):
        report.errors.append((row_no, msg))

    def warn(msg):
        report.warnings.append((row_no, msg))

    d: dict = {}
    for f in REQUIRED:
        if text(raw.get(f)) is None and f != "dob":
            err(f"'{f}' is empty")
    reg = text(raw.get("register_no"))
    if reg:
        reg = reg.replace(" ", "")
        if not REG_NO.fullmatch(reg):
            err(f"register number '{reg}' must be 12 digits starting with 5104")
    d["register_no"] = reg
    name = text(raw.get("name"))
    if name and len(name) > 120:
        err("name is longer than 120 characters")
    d["name"] = name
    try:
        d["dob"] = parse_dob(raw.get("dob"))
    except ValueError as e:
        err(str(e))
    try:
        sem = int(float(text(raw.get("semester")) or ""))
        if not 1 <= sem <= 8:
            raise ValueError
        d["semester"] = sem
    except ValueError:
        err(f"semester '{text(raw.get('semester'))}' must be a number from 1 to 8")
    for f in ("academic_year", "batch"):
        v = text(raw.get(f))
        if v and not YEARS.match(v):
            err(f"{f.replace('_', ' ')} '{v}' must look like 2023-2027")
        d[f] = v
    d["programme_code"] = text(raw.get("programme_code"))
    d["programme_name"] = text(raw.get("programme_name"))
    d["department_code"] = text(raw.get("department_code"))
    d["academic_pattern"] = (text(raw.get("academic_pattern")) or "").lower() or None
    d["regulation_id"] = text(raw.get("regulation_id"))
    g = (text(raw.get("gender")) or "").lower()
    if g in ("male", "m"):
        d["gender"] = "Male"
    elif g in ("female", "f"):
        d["gender"] = "Female"
    elif g in ("other", "transgender", "others"):
        d["gender"] = "Other"
    elif g:
        err(f"gender '{g}' is not recognised")
    else:
        d["gender"] = None
    sec = (text(raw.get("section")) or "").upper()
    d["section"] = None if sec in EMPTY_SECTION else sec[:5]  # "NIL" = not assigned yet
    mob = re.sub(r"\D", "", text(raw.get("mobile")) or "")
    if len(mob) == 12 and mob.startswith("91"):
        mob = mob[2:]
    if mob and len(mob) != 10:
        warn("mobile number is not 10 digits; left empty")
        mob = ""
    d["mobile"] = mob or None
    email = (text(raw.get("email")) or "").lower()
    if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        warn("email looks invalid; left empty")
        email = ""
    d["email"] = email or None
    pin = re.sub(r"\D", "", text(raw.get("pincode")) or "")
    if pin and len(pin) != 6:
        warn("pincode is not 6 digits; left empty")
        pin = ""
    d["pincode"] = pin or None
    for f, limit in (("address", 300), ("city", 80), ("district", 80), ("state", 60)):
        v = text(raw.get(f))
        d[f] = v[:limit] if v else None
    ay = text(raw.get("admission_year"))
    if ay and ay.isdigit():
        d["admission_year"] = int(ay)
    elif d.get("batch") and YEARS.match(d["batch"]):
        d["admission_year"] = int(d["batch"][:4])  # sheet left it empty: derive from the batch
    else:
        d["admission_year"] = None

    # Plausibility checks on the 12-digit register number (warnings only). The pattern seen in the
    # sample: 5104 (college) + 23 (admission year) + 243 (programme) + 3-digit serial.
    if reg and REG_NO.fullmatch(reg):
        if d.get("batch") and YEARS.match(d["batch"]) and reg[4:6] != d["batch"][2:4]:
            warn(f"register number digits 5-6 ('{reg[4:6]}') do not match the batch start year")
        digits = re.findall(r"\d+", d.get("programme_code") or "")
        if digits and reg[6:9] != digits[-1][-3:]:
            warn(f"register number digits 7-9 ('{reg[6:9]}') do not match programme code '{d['programme_code']}'")
    return d if len(report.errors) == errs_before else None


def read_sheet(path: Path, report: ImportReport, sheet: str | None = None) -> list[ParsedRow]:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet] if sheet else wb.worksheets[0]
    rows = ws.iter_rows(values_only=True)
    header = next(rows, None)
    if not header:
        report.errors.append((1, "the sheet is empty"))
        return []
    index: dict[int, str] = {}
    for i, h in enumerate(header):
        key = norm_header(h)
        if key in COLUMN_MAP:
            index[i] = COLUMN_MAP[key]
        elif key:
            (report.sensitive_columns_ignored if key in SENSITIVE_IGNORED else report.ignored_columns).append(str(h).strip())
    missing = REQUIRED - set(index.values())
    if missing:
        report.errors.append((1, "missing columns: " + ", ".join(sorted(missing))))
        return []
    parsed: list[ParsedRow] = []
    for n, row in enumerate(rows, start=2):
        if all(c is None or str(c).strip() == "" for c in row):
            continue
        report.rows_read += 1
        raw = {index[i]: row[i] for i in index if i < len(row)}
        data = _parse_row(n, raw, report)
        if data is not None:
            parsed.append(ParsedRow(n, data))
    if report.rows_read == 0:
        report.errors.append((2, "no student rows found"))
    # Register numbers are logins: every one must be unique.
    seen: dict[str, list[int]] = defaultdict(list)
    for p in parsed:
        seen[p.data["register_no"]].append(p.row)
    for reg, where in seen.items():
        if len(where) > 1:
            for r in where:
                report.errors.append((r, f"register number {reg} appears in rows {', '.join(map(str, where))}; each student needs a unique number"))
    return parsed


def import_students(db: Session, path: str | Path, *, dry_run: bool = False, sheet: str | None = None,
                    allowed_department: str | None = None, assign_to: str | None = None) -> ImportReport:
    """allowed_department: reject rows of any other department (used by the HOD upload).
    assign_to: staff ID of a counsellor who receives every imported student that has no counsellor yet."""
    report = ImportReport(dry_run=dry_run)
    parsed = read_sheet(Path(path), report, sheet)
    if allowed_department:
        for p in parsed:
            code = DEPARTMENTS.get(p.data["department_code"].upper(), (p.data["department_code"],))[0]
            if code != allowed_department:
                report.errors.append((p.row, f"department '{p.data['department_code']}' is not your department ({allowed_department})"))
    counsellor = None
    if assign_to:
        counsellor = db.scalar(select(User).where(User.username == assign_to.strip().upper(), User.role == Role.COUNSELLOR))
        if counsellor is None:
            report.errors.append((1, f"counsellor '{assign_to}' does not exist"))
    if not report.ok or dry_run:
        return report  # nothing is written

    depts: dict[str, Department] = {}
    for p in parsed:
        d = p.data
        code, dept_name = DEPARTMENTS.get(d["department_code"].upper(), (d["department_code"], d["department_code"]))
        dept = depts.get(code) or db.scalar(select(Department).where(Department.code == code))
        if dept is None:
            dept = Department(code=code, name=dept_name)
            db.add(dept)
            db.flush()
        depts[code] = dept

        fields = {k: d[k] for k in ("academic_year", "academic_pattern", "semester", "programme_code",
                                    "programme_name", "regulation_id", "admission_year", "batch", "dob", "gender",
                                    "mobile", "email", "address", "city", "district", "pincode", "state")}
        user = db.scalar(select(User).where(User.username == d["register_no"]))
        if user is None:
            user = User(username=d["register_no"], role=Role.STUDENT, full_name=d["name"],
                        department_id=dept.id, must_change_password=True,
                        password_hash=hash_password(initial_password(d["dob"])))
            db.add(user)
            db.flush()
            st = Student(user_id=user.id, register_no=d["register_no"], department_id=dept.id,
                         section=d["section"], **fields)
            db.add(st)
            report.created += 1
        else:
            if user.role != Role.STUDENT:
                db.rollback()
                report.errors.append((p.row, f"{d['register_no']} already belongs to a non-student account"))
                return report
            user.full_name = d["name"]
            user.department_id = dept.id
            st = db.scalar(select(Student).where(Student.user_id == user.id))
            for k, v in fields.items():
                setattr(st, k, v)
            st.department_id = dept.id
            if d["section"]:  # never overwrite an assigned section with an empty "NIL"
                st.section = d["section"]
            report.updated += 1
        if counsellor is not None and st.counsellor_id is None:
            st.counsellor_id = counsellor.id
            report.assigned += 1
    db.commit()
    return report


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("path")
    ap.add_argument("--dry-run", action="store_true", help="validate only; write nothing")
    ap.add_argument("--sheet")
    ap.add_argument("--assign-to", help="staff ID of the counsellor who gets every unassigned student")
    args = ap.parse_args()
    with SessionLocal() as db:
        rep = import_students(db, args.path, dry_run=args.dry_run, sheet=args.sheet, assign_to=args.assign_to)
    print(f"Rows read: {rep.rows_read}")
    if rep.sensitive_columns_ignored:
        print("Sensitive columns IGNORED (never stored): " + ", ".join(rep.sensitive_columns_ignored))
    if rep.ignored_columns:
        print("Other columns ignored: " + ", ".join(rep.ignored_columns))
    for row, msg in rep.warnings:
        print(f"  warning, row {row}: {msg}")
    for row, msg in rep.errors:
        print(f"  ERROR,   row {row}: {msg}")
    if not rep.ok:
        print("\nNothing was written. Fix the errors above and run again.")
        return 1
    if rep.dry_run:
        print(f"\nDry run OK: {rep.rows_read} rows would be imported. Nothing was written.")
    else:
        print(f"\nDone: {rep.created} created, {rep.updated} updated, {rep.assigned} assigned to a counsellor.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
