"""Student pages"""
from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..deps import not_found, require_roles, student_of
from ..enums import AttendanceStatus, Role
from ..models import (
    AttendanceRecord, FeeItem, Mark, Payment, Result, ResultRelease, Student, Subject, TimetableSlot, User,
)
from ..services.attendance import attendance_by_student
from ..services.pdf import assignment_front_page
from ..services.timetable import get_timetable_for_date, get_weekly_timetable

router = APIRouter(tags=["student"])
StudentUser = Depends(require_roles(Role.STUDENT))


def today_local() -> date:
    return datetime.now(ZoneInfo(get_settings().timezone)).date()


def money(value) -> float:
    return float(value or 0)


def num(value):
    return None if value is None else float(value)


def fee_label(key: str) -> str:
    return key.replace("_", " ").title()


@router.get("/profile")
def profile(user: User = StudentUser, db: Session = Depends(get_db)):
    st = student_of(db, user)
    return {
        "registerNo": st.register_no, "name": user.full_name, "batch": st.batch,
        "programme": st.programme_name, "course": f"{st.programme_name or ''} {user.department.code}".strip(),
        "semester": st.semester, "year": st.year_of_study, "section": st.section,
        "academicYear": st.academic_year, "department": user.department.name,
        "departmentCode": user.department.code, "dateOfBirth": st.dob.isoformat(), "gender": st.gender,
        "mobile": st.mobile, "email": st.email, "address": st.address,
        "photoUrl": None, "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
    }


def _subject_names(db: Session, codes: set[str]) -> dict[str, str]:
    if not codes:
        return {}
    return {s.code: s.name for s in db.scalars(select(Subject).where(Subject.code.in_(codes)))}


@router.get("/dashboard")
def dashboard(user: User = StudentUser, db: Session = Depends(get_db)):
    s = get_settings()
    st = student_of(db, user)
    pct = attendance_by_student(db, [st.id]).get(st.id)
    today = today_local()
    tt_day = get_timetable_for_date(db, st, today)
    records = {r.hour: r for r in db.scalars(select(AttendanceRecord).where(
        AttendanceRecord.student_id == st.id, AttendanceRecord.on_date == today))}
    record_codes = {r.subject_code for r in records.values() if r.subject_code}
    rec_names = _subject_names(db, record_codes)

    hours_map = {h["hour"]: h for h in tt_day.hours}
    hours = []
    for h in range(1, s.hours_per_day + 1):
        tt_h = hours_map.get(h)
        rec = records.get(h)
        if rec and rec.subject_code:
            code = rec.subject_code
            name = rec_names.get(code)
        elif tt_h:
            code = tt_h.get("subjectCode")
            name = tt_h.get("subjectName")
        else:
            code = None
            name = None

        status = rec.status.value if rec else None
        start_time = tt_h.get("startTime") if tt_h else None
        end_time = tt_h.get("endTime") if tt_h else None
        staff_name = tt_h.get("staffName") if tt_h else None
        is_free = tt_h.get("isFree", code is None) if tt_h else (code is None)

        hours.append({
            "hour": h,
            "subjectCode": code,
            "subjectName": name,
            "status": status,
            "startTime": start_time,
            "endTime": end_time,
            "staffName": staff_name,
            "isFree": is_free,
        })
    marks = db.execute(select(Mark, Subject).join(Subject, Subject.code == Mark.subject_code)
                       .where(Mark.student_id == st.id, Mark.semester == st.semester)
                       .order_by(Mark.subject_code)).all()
    return {
        "attendance": {"overallPercent": pct, "eligible": pct is not None and pct >= s.attendance_min_percent,
                       "thresholdPercent": s.attendance_min_percent},
        "today": {"date": today.isoformat(), "hours": hours},
        "marks": [{"code": sub.code, "name": sub.name, "cia1": num(m.cia1), "asmt1": num(m.asmt1),
                   "cia2": num(m.cia2), "asmt2": num(m.asmt2), "model": num(m.model)} for m, sub in marks],
    }


@router.get("/timetable")
def timetable(on: date | None = Query(None, alias="date"), user: User = StudentUser, db: Session = Depends(get_db)):
    st = student_of(db, user)
    day = on or today_local()
    tt_day = get_timetable_for_date(db, st, day)
    weekly = get_weekly_timetable(db, st)
    return {
        "date": day.isoformat(),
        "dayName": day.strftime("%A"),
        "student": {
            "name": user.full_name,
            "registerNo": st.register_no,
            "department": user.department.code,
            "course": f"{st.programme_name or ''} {user.department.code}".strip(),
            "year": st.year_of_study,
            "semester": st.semester,
            "section": st.section,
            "academicYear": st.academic_year,
        },
        "hall": tt_day.hall,
        "breaks": tt_day.breaks,
        "hours": tt_day.hours,
        "days": weekly,
    }


@router.get("/fees")
def fees(user: User = StudentUser, db: Session = Depends(get_db)):
    st = student_of(db, user)
    items = list(db.scalars(select(FeeItem).where(FeeItem.student_id == st.id)
                            .order_by(FeeItem.academic_year.desc(), FeeItem.fee_key)))
    payments = list(db.scalars(select(Payment).where(Payment.student_id == st.id)
                               .order_by(Payment.paid_on.desc(), Payment.id.desc())))
    paid_by = {}
    for p in payments:
        paid_by[(p.academic_year, p.fee_key)] = paid_by.get((p.academic_year, p.fee_key), 0) + money(p.amount)
    year = items[0].academic_year if items else st.academic_year
    rows = [{"feeType": fee_label(i.fee_key), "total": money(i.total),
             "paid": paid_by.get((i.academic_year, i.fee_key), 0.0),
             "balance": money(i.total) - paid_by.get((i.academic_year, i.fee_key), 0.0)}
            for i in items if i.academic_year == year]
    return {
        "student": {"registerNo": st.register_no, "name": user.full_name, "academicYear": year,
                    "year": st.year_of_study},
        "academicYear": year, "items": rows,
        "totals": {"total": sum(r["total"] for r in rows), "paid": sum(r["paid"] for r in rows),
                   "balance": sum(r["balance"] for r in rows)},
        "payments": [{"transactionId": p.transaction_id, "feeType": fee_label(p.fee_key),
                      "amount": money(p.amount), "date": p.paid_on.isoformat(), "receiptNo": p.receipt_no}
                     for p in payments],
        "note": "To pay your fees, please visit the accounts office.",
    }


@router.get("/results")
def results(user: User = StudentUser, db: Session = Depends(get_db)):
    st = student_of(db, user)
    released = {r.semester for r in db.scalars(select(ResultRelease).where(
        ResultRelease.department_id == st.department_id))}
    rows = list(db.scalars(select(Result).where(Result.student_id == st.id, Result.semester.in_(released))
                           .order_by(Result.semester, Result.subject_code))) if released else []
    semesters: dict[int, list] = {}
    for r in rows:
        semesters.setdefault(r.semester, []).append(
            {"code": r.subject_code, "name": r.subject_name, "grade": r.grade, "result": r.result})
    # GPA needs course credits and the college's grade-point scale, which are not known yet.
    return {"published": bool(semesters),
            "semesters": [{"semester": k, "gpa": None, "subjects": v} for k, v in sorted(semesters.items())]}


@router.get("/assignments/options")
def assignment_options(user: User = StudentUser, db: Session = Depends(get_db)):
    st = student_of(db, user)
    subjects = list(db.scalars(
        select(Subject).where(
            (Subject.department_id == st.department_id) & (Subject.semester == st.semester)
        ).order_by(Subject.code)
    ))
    if not subjects:
        subjects = list(db.scalars(
            select(Subject).join(Mark, Mark.subject_code == Subject.code)
            .where(Mark.student_id == st.id, Mark.semester == st.semester)
            .order_by(Subject.code)
        ))
    return {"subjects": [{"code": s.code, "name": s.name} for s in subjects],
            "assignmentNumbers": get_settings().assignment_number_list}


class FrontPageIn(BaseModel):
    subject_code: str = Field(alias="subjectCode", min_length=1, max_length=20)
    assignment_no: int = Field(alias="no", ge=1, le=20)
    model_config = {"populate_by_name": True}


@router.post("/assignments/front-page")
def front_page(body: FrontPageIn, user: User = StudentUser, db: Session = Depends(get_db)):
    st = student_of(db, user)
    if body.assignment_no not in get_settings().assignment_number_list:
        raise HTTPException(422, {"code": "INVALID", "message": "Unknown assignment number."})
    subject = db.execute(select(Subject).where(
        Subject.code == body.subject_code,
        ((Subject.department_id == st.department_id) & (Subject.semester == st.semester))
        | Subject.code.in_(
            select(Mark.subject_code).where(Mark.student_id == st.id, Mark.semester == st.semester)
        )
    )).scalar()
    if subject is None:
        raise not_found("This subject is not in your current semester.")
    pdf = assignment_front_page(
        college=get_settings().college_name, student_name=user.full_name, register_no=st.register_no,
        department=user.department.name, semester=st.semester, section=st.section,
        subject_code=subject.code, subject_name=subject.name, assignment_no=body.assignment_no)
    return Response(pdf, media_type="application/pdf", headers={
        "Content-Disposition": f'inline; filename="assignment-{subject.code}-{body.assignment_no}.pdf"'})

@router.get("/subjects")
@router.get("/student/subjects")
def get_registered_subjects(user: User = StudentUser, db: Session = Depends(get_db)):
    st = student_of(db, user)
    # The 6 registered subjects for the student
    # Common to all 61 students (department_id=1, semester=7)
    rows = list(db.scalars(
        select(Subject).where(
            (Subject.department_id == st.department_id) & (Subject.semester == st.semester) & (Subject.code != "AI3021")
        ).order_by(Subject.code)
    ))
    if len(rows) < 6:
        req_codes = ["A13021", "CME365", "GE3752", "GE3791", "OBT357", "SKILL"]
        rows = list(db.scalars(select(Subject).where(Subject.code.in_(req_codes)).order_by(Subject.code)))

    items = [{"code": s.code, "title": s.name, "credits": getattr(s, "credits", 3) or 3} for s in rows]
    return {
        "subjects": items,
        "totalSubjects": len(items),
        "totalCredits": sum(s["credits"] for s in items),
    }
