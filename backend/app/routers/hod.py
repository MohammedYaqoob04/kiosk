"""HOD pages: dashboard, student assignment, CSV reports."""
from datetime import date, datetime, time, timedelta

import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import audit
from ..database import get_db
from ..deps import not_found, require_roles
from ..enums import Decision, LeaveStatus, Role, Stage
from ..models import LeaveRequest, Notice, Student, User, utcnow
from ..services.attendance import attendance_by_student, is_below_min
from ..services.csv_safe import to_csv
from ..services.leave_workflow import PENDING
from .leave import serialize_leave
from .staff import student_out

router = APIRouter(prefix="/hod", tags=["hod"])
Hod = Depends(require_roles(Role.HOD))


def _dept_students(db: Session, user: User) -> list[Student]:
    return list(db.scalars(select(Student).join(User, User.id == Student.user_id)
                           .where(Student.department_id == user.department_id)
                           .order_by(Student.register_no)))


def _dept_counsellors(db: Session, user: User) -> list[User]:
    return list(db.scalars(select(User).where(
        User.role == Role.COUNSELLOR, User.department_id == user.department_id, User.is_active.is_(True))
        .order_by(User.full_name)))


@router.get("/overview")
def overview(user: User = Hod, db: Session = Depends(get_db)):
    students = _dept_students(db, user)
    pct = attendance_by_student(db, [s.id for s in students])
    month_start = datetime.combine(date.today().replace(day=1), time.min)
    dept_leaves = select(LeaveRequest).join(Student, Student.id == LeaveRequest.student_id).where(
        Student.department_id == user.department_id)
    pending_rows = db.scalars(dept_leaves.where(LeaveRequest.status == LeaveStatus.PENDING_HOD)
                              .order_by(LeaveRequest.created_at, LeaveRequest.id)).all()
    leave_month = db.scalar(select(func.count()).select_from(LeaveRequest).join(
        Student, Student.id == LeaveRequest.student_id).where(
        Student.department_id == user.department_id, LeaveRequest.created_at >= month_start))
    notices_sent = db.scalar(select(func.count()).select_from(Notice).where(
        Notice.author_id == user.id, Notice.withdrawn_at.is_(None)))

    sections: dict[str, list[float]] = {}
    counts: dict[str, int] = {}
    below = []
    for s in students:
        key = s.section or "Unassigned"
        counts[key] = counts.get(key, 0) + 1
        p = pct.get(s.id)
        if p is not None:
            sections.setdefault(key, []).append(p)
        if is_below_min(p):
            below.append({"registerNo": s.register_no, "name": s.user.full_name, "section": s.section,
                          "attendancePercentage": p})
    below.sort(key=lambda r: r["attendancePercentage"])

    # Real year-wise breakdown (Years 2, 3, 4)
    year_breakdown = []
    for y in (2, 3, 4):
        y_students = [s for s in students if s.year_of_study == y]
        y_count = len(y_students)
        if y_count == 0:
            year_breakdown.append({
                "year": y,
                "studentCount": 0,
                "presentCount": None,
                "absentCount": None,
                "averageAttendancePercent": None,
            })
        else:
            y_pcts = [pct[s.id] for s in y_students if pct.get(s.id) is not None]
            p_cnt = sum(1 for p in y_pcts if p >= 75) if y_pcts else None
            a_cnt = sum(1 for p in y_pcts if p < 75) if y_pcts else None
            avg_p = round(sum(y_pcts) / len(y_pcts), 2) if y_pcts else None
            year_breakdown.append({
                "year": y,
                "studentCount": y_count,
                "presentCount": p_cnt,
                "absentCount": a_cnt,
                "averageAttendancePercent": avg_p,
            })

    all_pcts = [p for p in pct.values() if p is not None]
    dept_present = sum(1 for p in all_pcts if p >= 75) if all_pcts else None
    dept_absent = sum(1 for p in all_pcts if p < 75) if all_pcts else None
    dept_avg = round(sum(all_pcts) / len(all_pcts), 2) if all_pcts else None
    faculty_list = _dept_counsellors(db, user)

    return {
        "cards": {"pendingApprovals": len(pending_rows), "totalStudents": len(students),
                  "totalFaculty": len(faculty_list),
                  "belowMinAttendance": len(below), "leaveThisMonth": leave_month or 0,
                  "noticesSent": notices_sent or 0},
        "attendanceBySection": [
            {"section": k, "students": counts[k],
             "averagePercent": round(sum(sections[k]) / len(sections[k]), 2) if sections.get(k) else None}
            for k in sorted(counts)],
        "belowMinStudents": below,
        "pendingApprovals": [serialize_leave(db, r, context=True) for r in pending_rows[:50]],  # oldest first
        "yearBreakdown": year_breakdown,
        "departmentSummary": {
            "totalStudents": len(students),
            "totalFaculty": len(faculty_list),
            "presentCount": dept_present,
            "absentCount": dept_absent,
            "averageAttendancePercent": dept_avg,
            "passPercentage": None,  # Honest empty state: no exam marks in dataset
        },
    }


@router.get("/analytics")
def analytics(user: User = Hod, db: Session = Depends(get_db)):
    students = _dept_students(db, user)
    pct = attendance_by_student(db, [s.id for s in students])
    all_pcts = [p for p in pct.values() if p is not None]
    dept_avg = round(sum(all_pcts) / len(all_pcts), 2) if all_pcts else None
    counsellors = _dept_counsellors(db, user)

    dept_leaves = select(LeaveRequest).join(Student, Student.id == LeaveRequest.student_id).where(
        Student.department_id == user.department_id)
    pending_approvals = db.scalar(select(func.count()).select_from(dept_leaves.where(
        LeaveRequest.status.in_([LeaveStatus.PENDING_HOD, LeaveStatus.PENDING_COUNSELLOR])).subquery())) or 0

    return {
        "totalStudents": len(students),
        "totalFaculty": len(counsellors),
        "overallAttendancePercent": dept_avg,
        "passPercentage": None,  # None when no real exam data is available
        "pendingApprovals": pending_approvals,
    }


@router.get("/counsellors")
def counsellors(user: User = Hod, db: Session = Depends(get_db)):
    out = []
    for c in _dept_counsellors(db, user):
        n_students = db.scalar(select(func.count()).select_from(Student).where(Student.counsellor_id == c.id))
        n_pending = db.scalar(select(func.count()).select_from(LeaveRequest).where(
            LeaveRequest.counsellor_id == c.id, LeaveRequest.status == LeaveStatus.PENDING_COUNSELLOR))
        out.append({"id": c.username, "staffId": c.username, "name": c.full_name,
                    "department": c.department.name, "departmentCode": c.department.code,
                    "studentCount": n_students or 0, "pendingCount": n_pending or 0})
    return out


@router.get("/students")
def students(year: int | None = Query(None), user: User = Hod, db: Session = Depends(get_db)):
    rows = _dept_students(db, user)
    if year is not None:
        rows = [s for s in rows if s.year_of_study == year]
    pct = attendance_by_student(db, [s.id for s in rows])
    return [{**student_out(s, pct.get(s.id)),
             "counsellor": {"id": s.counsellor.username, "staffId": s.counsellor.username, "name": s.counsellor.full_name} if s.counsellor else None}
            for s in rows]


@router.get("/classes")
def list_classes(user: User = Hod, db: Session = Depends(get_db)):
    """List department classes (Years 2, 3, 4) with student counts and assigned counsellor."""
    dept_sts = _dept_students(db, user)
    sections = sorted(list({s.section for s in dept_sts if s.section} | {"A"}))
    classes = []
    for y in (2, 3, 4):
        for sec in sections:
            matching = [s for s in dept_sts if s.year_of_study == y and (s.section == sec or (not s.section and sec == "A"))]
            counsellor = None
            for s in matching:
                if s.counsellor:
                    counsellor = {"id": s.counsellor.username, "staffId": s.counsellor.username, "name": s.counsellor.full_name}
                    break
            classes.append({
                "year": y,
                "section": sec,
                "className": f"Year {y} - {user.department.code} - Section {sec}",
                "studentCount": len(matching),
                "counsellor": counsellor,
            })
    return classes


class AssignClassIn(BaseModel):
    counsellor_id: str = Field(alias="counsellorId", min_length=1, max_length=40)
    year: int = Field(ge=1, le=4)
    section: str = Field(min_length=1, max_length=5)
    model_config = {"populate_by_name": True}


@router.post("/assign-class")
def assign_class(body: AssignClassIn, user: User = Hod, db: Session = Depends(get_db)):
    c = _counsellor_in_dept(db, user, body.counsellor_id)
    sec = body.section.strip().upper()
    sems = [body.year * 2 - 1, body.year * 2]
    students = list(db.scalars(select(Student).where(
        Student.department_id == user.department_id,
        Student.semester.in_(sems),
        (Student.section == sec) | (Student.section.is_(None))
    )))
    for s in students:
        s.counsellor_id = c.id
        s.section = sec
    class_name = f"Year {body.year} - {user.department.code} - Section {sec}"
    audit.log(db, user, audit.STUDENT_ASSIGN, target_type="user", target_id=c.username,
              detail={"class": class_name, "count": len(students)})
    db.commit()
    return {"updated": len(students), "className": class_name, "counsellor": c.full_name}


class UnassignClassIn(BaseModel):
    year: int = Field(ge=1, le=4)
    section: str = Field(min_length=1, max_length=5)


@router.post("/unassign-class")
def unassign_class(body: UnassignClassIn, user: User = Hod, db: Session = Depends(get_db)):
    sec = body.section.strip().upper()
    sems = [body.year * 2 - 1, body.year * 2]
    students = list(db.scalars(select(Student).where(
        Student.department_id == user.department_id,
        Student.semester.in_(sems),
        Student.section == sec
    )))
    for s in students:
        s.counsellor_id = None
    class_name = f"Year {body.year} - {user.department.code} - Section {sec}"
    audit.log(db, user, audit.STUDENT_UNASSIGN, target_type="class", target_id=class_name,
              detail={"count": len(students)})
    db.commit()
    return {"updated": len(students), "className": class_name}


class AssignIn(BaseModel):
    counsellor_id: str = Field(alias="counsellorId", min_length=1, max_length=40)  # a staff ID
    register_nos: list[str] = Field(alias="registerNos", min_length=1, max_length=500)
    model_config = {"populate_by_name": True}


class AssignSectionIn(BaseModel):
    counsellor_id: str = Field(alias="counsellorId", min_length=1, max_length=40)  # a staff ID
    section: str = Field(min_length=1, max_length=5)
    model_config = {"populate_by_name": True}


def _counsellor_in_dept(db: Session, user: User, staff_id: str) -> User:
    c = db.scalar(select(User).where(User.username == staff_id.strip().upper()))
    if c is None or c.role != Role.COUNSELLOR or c.department_id != user.department_id or not c.is_active:
        raise HTTPException(422, {"code": "INVALID", "message": "Choose a counsellor from your department."})
    return c


@router.post("/assign")
def assign(body: AssignIn, user: User = Hod, db: Session = Depends(get_db)):
    c = _counsellor_in_dept(db, user, body.counsellor_id)
    wanted = {r.strip() for r in body.register_nos}
    found = list(db.scalars(select(Student).where(
        Student.register_no.in_(wanted), Student.department_id == user.department_id)))
    for s in found:
        s.counsellor_id = c.id
    skipped = sorted(wanted - {s.register_no for s in found})
    audit.log(db, user, audit.STUDENT_ASSIGN, target_type="user", target_id=c.username, detail={"count": len(found)})
    db.commit()
    return {"updated": len(found), "skipped": skipped}


@router.post("/assign-section")
def assign_section(body: AssignSectionIn, user: User = Hod, db: Session = Depends(get_db)):
    c = _counsellor_in_dept(db, user, body.counsellor_id)
    section = body.section.strip().upper()
    found = list(db.scalars(select(Student).where(
        Student.section == section, Student.department_id == user.department_id)))
    for s in found:
        s.counsellor_id = c.id
    audit.log(db, user, audit.STUDENT_ASSIGN, target_type="user", target_id=c.username,
              detail={"count": len(found), "section": section})
    db.commit()
    return {"updated": len(found)}


@router.delete("/assign/{register_no}")
def unassign(register_no: str, user: User = Hod, db: Session = Depends(get_db)):
    st = db.scalar(select(Student).where(Student.register_no == register_no,
                                         Student.department_id == user.department_id))
    if st is None:
        raise not_found("Student not found.")
    st.counsellor_id = None
    audit.log(db, user, audit.STUDENT_UNASSIGN, target_type="student", target_id=st.register_no)
    db.commit()
    return {"updated": 1}


def _csv_response(text: str, filename: str) -> Response:
    return Response(text, media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/reports/leave.csv")
def leave_report(from_: date | None = Query(None, alias="from"), to: date | None = None,
                 status: LeaveStatus | None = None, user: User = Hod, db: Session = Depends(get_db)):
    q = select(LeaveRequest).join(Student, Student.id == LeaveRequest.student_id).where(
        Student.department_id == user.department_id)
    if from_:
        q = q.where(LeaveRequest.created_at >= datetime.combine(from_, time.min))
    if to:
        q = q.where(LeaveRequest.created_at < datetime.combine(to + timedelta(days=1), time.min))
    if status:
        q = q.where(LeaveRequest.status == status)
    rows = []
    for r in db.scalars(q.order_by(LeaveRequest.created_at, LeaveRequest.id)):
        act = {a.stage: a for a in r.actions}
        c, h = act.get(Stage.COUNSELLOR), act.get(Stage.HOD)
        rows.append([r.id, r.student.register_no, r.student.user.full_name, r.student.section or "",
                     r.type.value, r.category, r.from_date, r.to_date, r.days, r.status.value,
                     r.created_at.strftime("%Y-%m-%d %H:%M"), r.counsellor.full_name,
                     c.decision.value if c else "", c.remark if c else "",
                     h.decision.value if h else "", h.remark if h else ""])
    header = ["Request ID", "Register No", "Name", "Section", "Type", "Category", "From", "To", "Days", "Status",
              "Submitted (UTC)", "Counsellor", "Counsellor decision", "Counsellor reason",
              "HOD decision", "HOD reason"]
    return _csv_response(to_csv(header, rows), "leave-od-log.csv")


@router.get("/reports/attendance-shortage.csv")
def shortage_report(user: User = Hod, db: Session = Depends(get_db)):
    students = _dept_students(db, user)
    pct = attendance_by_student(db, [s.id for s in students])
    rows = [[s.register_no, s.user.full_name, s.section or "", s.counsellor.full_name if s.counsellor else "",
             pct[s.id]] for s in students if is_below_min(pct.get(s.id))]
    rows.sort(key=lambda r: r[4])
    return _csv_response(to_csv(["Register No", "Name", "Section", "Counsellor", "Attendance %"], rows),
                         "attendance-shortage.csv")


MAX_SHEET_BYTES = 5 * 1024 * 1024


@router.post("/students/import")
def import_sheet(file: UploadFile = File(...), dry_run: bool = Form(True, alias="dryRun"),
                 assign_to: str | None = Form(None, alias="assignTo"),
                 user: User = Hod, db: Session = Depends(get_db)):
    """Upload the college's student Excel sheet (.xlsx). Check first with dryRun=true, then send again with
    dryRun=false. Only rows of the HOD's own department are accepted. Slow for big sheets (passwords are hashed)."""
    from scripts.import_students import import_students

    data = file.file.read(MAX_SHEET_BYTES + 1)
    if not data or len(data) > MAX_SHEET_BYTES:
        raise HTTPException(422, {"code": "BAD_FILE", "message": "Upload an .xlsx file of 5 MB or less."})
    if data[:2] != b"PK":  # an .xlsx file is a zip archive
        raise HTTPException(422, {"code": "BAD_FILE", "message": "That is not an Excel (.xlsx) file."})
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "students.xlsx"
        path.write_bytes(data)
        try:
            rep = import_students(db, path, dry_run=dry_run, allowed_department=user.department.code,
                                  assign_to=assign_to)
        except Exception:
            db.rollback()
            raise HTTPException(422, {"code": "BAD_FILE", "message": "The sheet could not be read."})
    if rep.ok and not dry_run:
        audit.log(db, user, audit.STUDENTS_IMPORT, target_type="students",
                  detail={"created": rep.created, "updated": rep.updated})
        db.commit()
    return {"ok": rep.ok, "dryRun": rep.dry_run, "rowsRead": rep.rows_read, "created": rep.created,
            "updated": rep.updated, "assigned": rep.assigned,
            "errors": [{"row": r, "message": m} for r, m in rep.errors],
            "warnings": [{"row": r, "message": m} for r, m in rep.warnings],
            "ignoredSensitiveColumns": rep.sensitive_columns_ignored}
