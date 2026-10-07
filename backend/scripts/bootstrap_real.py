"""One command to set up the REAL system: department, staff accounts, student sheet.

    python -m scripts.bootstrap_real --students private_data/students.xlsx --staff private_data/staff.json --dry-run
    python -m scripts.bootstrap_real --students private_data/students.xlsx --staff private_data/staff.json

staff.json (keep it in private_data/, which is gitignored):
  [{"username": "anitha-staff", "name": "Anitha", "password": "ani123", "role": "COUNSELLOR", "department": "AIDS"}, ...]
Staff passwords here are only TEMPORARY: every account must choose a new one at first login.
If the department has exactly one counsellor, every student without a counsellor is assigned to them.
Safe to run again: existing accounts keep their passwords.
"""
import argparse
import json
import sys

from sqlalchemy import func, select

from app.database import SessionLocal
from app.enums import Role
from app.models import Department, User
from app.security import hash_password
from scripts.import_students import DEPARTMENTS, import_students

FULL_NAMES = {code: name for code, name in DEPARTMENTS.values()}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--students", required=True)
    ap.add_argument("--staff", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    with open(args.staff, encoding="utf-8") as fh:
        staff = json.load(fh)

    with SessionLocal() as db:
        # 1. validate the sheet first: if it is bad, nothing is created
        check = import_students(db, args.students, dry_run=True)
        for row, msg in check.errors:
            print(f"  ERROR, row {row}: {msg}")
        if not check.ok:
            print("\nNothing was written. Fix the sheet and run again.")
            return 1
        for row, msg in check.warnings:
            print(f"  warning, row {row}: {msg}")
        if check.sensitive_columns_ignored:
            print("Sensitive columns ignored (never stored): " + ", ".join(check.sensitive_columns_ignored))
        if args.dry_run:
            print(f"\nDry run OK: {check.rows_read} students and {len(staff)} staff accounts would be set up.")
            return 0

        # 2. department + staff
        created_staff = []
        for s in staff:
            code = DEPARTMENTS.get(s["department"].upper(), (s["department"], s["department"]))[0]
            dept = db.scalar(select(Department).where(Department.code == code))
            if dept is None:
                dept = Department(code=code, name=FULL_NAMES.get(code, code))
                db.add(dept)
                db.flush()
            username = s["username"].strip().upper()
            if db.scalar(select(User).where(User.username == username)):
                print(f"  staff {username} already exists: left unchanged")
                continue
            if len(s["password"]) < 8 or not any(c.isdigit() for c in s["password"]):
                print(f"  note: {username} has a short temporary password; they must change it at first login")
            db.add(User(username=username, full_name=s["name"].strip(), role=Role(s["role"].upper()),
                        department_id=dept.id, password_hash=hash_password(s["password"]), must_change_password=True))
            created_staff.append(username)
        db.commit()

        # 3. students (assigned to the only counsellor, if there is just one)
        counsellors = db.scalars(select(User).where(User.role == Role.COUNSELLOR)).all()
        assign_to = counsellors[0].username if len(counsellors) == 1 else None
        rep = import_students(db, args.students, assign_to=assign_to)
        if not rep.ok:
            for row, msg in rep.errors:
                print(f"  ERROR, row {row}: {msg}")
            return 1
    print(f"\nDone. Staff created: {', '.join(created_staff) or 'none'}")
    print(f"Students: {rep.created} created, {rep.updated} updated, {rep.assigned} assigned to {assign_to or 'nobody (assign in the HOD page)'}.")
    print("Student login: register number + date of birth as ddmmyyyy. Everyone changes the password at first login.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
