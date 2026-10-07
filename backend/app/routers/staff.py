"""Counsellor pages: My Students."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..deps import not_found, require_roles
from ..enums import LeaveStatus, Role
from ..models import LeaveRequest, Student, User
from ..services.attendance import attendance_by_student, is_below_min

router = APIRouter(prefix="/staff", tags=["counsellor"])
Counsellor = Depends(require_roles(Role.COUNSELLOR))
NOT_ASSIGNED = "This student is not assigned to you."


def _like(text: str) -> str:
    return "%" + text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


def student_out(st: Student, pct: float | None) -> dict:
    """Same shape as the kiosk's AssignedStudent. Contact details are hidden unless STAFF_SEE_CONTACT=true."""
    contact = get_settings().staff_see_contact
    return {
        "name": st.user.full_name, "registerNo": st.register_no, "department": st.department.name,
        "departmentCode": st.department.code, "attendancePercentage": pct,
        "belowMinAttendance": is_below_min(pct),
        "assignedCounsellorId": st.counsellor.username if st.counsellor else None,
        "batch": st.batch, "programme": st.programme_name, "course": f"{st.programme_name or ''} {st.department.code}".strip(),
        "semester": st.semester, "year": st.year_of_study, "section": st.section,
        "mobile": (st.mobile or "") if contact else "", "email": (st.email or "") if contact else "",
        "gender": st.gender,
    }


@router.get("/students")
def my_students(q: str | None = None, below_min: bool = False,
                user: User = Counsellor, db: Session = Depends(get_db)):
    """The signed-in counsellor's students (any counsellorId in the URL is ignored)."""
    query = select(Student).join(User, User.id == Student.user_id).where(Student.counsellor_id == user.id)
    if q and q.strip():
        pat = _like(q.strip())
        query = query.where(User.full_name.ilike(pat, escape="\\") | Student.register_no.like(pat, escape="\\"))
    students = db.scalars(query).all()
    ids = [s.id for s in students]
    pct = attendance_by_student(db, ids)
    counts = {sid: n for sid, n in db.execute(
        select(LeaveRequest.student_id, func.count()).where(LeaveRequest.student_id.in_(ids))
        .group_by(LeaveRequest.student_id))} if ids else {}
    pending = {sid: n for sid, n in db.execute(
        select(LeaveRequest.student_id, func.count()).where(
            LeaveRequest.student_id.in_(ids), LeaveRequest.counsellor_id == user.id,
            LeaveRequest.status == LeaveStatus.PENDING_COUNSELLOR).group_by(LeaveRequest.student_id))} if ids else {}
    rows = []
    for s in students:
        p = pct.get(s.id)
        if below_min and not is_below_min(p):
            continue
        rows.append({**student_out(s, p), "leaveCount": counts.get(s.id, 0), "pendingCount": pending.get(s.id, 0)})
    rows.sort(key=lambda r: (r["attendancePercentage"] is None, r["attendancePercentage"] or 0, r["registerNo"]))
    return rows


@router.get("/students/{register_no}")
def student_summary(register_no: str, user: User = Counsellor, db: Session = Depends(get_db)):
    st = db.scalar(select(Student).where(Student.register_no == register_no))
    if st is None or st.counsellor_id != user.id:
        raise not_found(NOT_ASSIGNED)  # same answer whether or not the student exists
    p = attendance_by_student(db, [st.id]).get(st.id)
    recent = db.scalars(select(LeaveRequest).where(LeaveRequest.student_id == st.id)
                        .order_by(LeaveRequest.created_at.desc()).limit(5)).all()
    # Deliberately no mobile, email or date of birth in the summary.
    return {"registerNo": st.register_no, "name": st.user.full_name, "batch": st.batch, "section": st.section,
            "semester": st.semester, "attendancePercentage": p, "belowMinAttendance": is_below_min(p),
            "recentRequests": [{"id": str(r.id), "kind": r.type.value, "category": r.category,
                                "status": r.status.value, "fromDate": r.from_date.isoformat(),
                                "toDate": r.to_date.isoformat(),
                                "rejectionReason": next((a.remark for a in reversed(r.actions)
                                                         if a.decision.value == "REJECT"), None)} for r in recent]}


from datetime import date
from pydantic import BaseModel
from ..models import Timetable, TimetableEntry
from ..services.timetable import get_weekly_timetable

class TimetableSlotPayload(BaseModel):
    hour: int
    period: int | None = None
    time: str | None = None
    startTime: str | None = None
    endTime: str | None = None
    subjectCode: str | None = None
    subjectName: str | None = None
    staffName: str | None = None
    room: str | None = None
    isFree: bool = False

class TimetableDayPayload(BaseModel):
    dayName: str
    weekday: int
    hall: str | None = None
    hours: list[TimetableSlotPayload] = []

class TimetableUploadPayload(BaseModel):
    className: str
    hall: str = "C14"
    days: list[TimetableDayPayload]

@router.get("/timetable")
def staff_timetable(className: str | None = None, user: User = Counsellor, db: Session = Depends(get_db)):
    sem = 7
    if className:
        if "II-" in className or className == "II" or "2" in className:
            sem = 3
        elif "III-" in className or className == "III" or "3" in className:
            sem = 5
        elif "IV-" in className or className == "IV" or "4" in className:
            sem = 7

    tt = db.scalars(
        select(Timetable).where(
            Timetable.department_id == user.department_id,
            Timetable.semester == sem
        ).order_by(Timetable.effective_from.desc(), Timetable.id.desc())
    ).first()

    if not tt:
        return {"className": className or "IV-A", "hall": None, "days": []}

    st = db.scalars(select(Student).where(Student.semester == sem)).first()
    if st:
        weekly = get_weekly_timetable(db, st)
    else:
        weekly = []
    return {"className": className or "IV-A", "hall": tt.hall, "days": weekly}

@router.post("/timetable")
def save_timetable(payload: TimetableUploadPayload, user: User = Counsellor, db: Session = Depends(get_db)):
    sem = 7
    if payload.className:
        if "II-" in payload.className or payload.className == "II" or "2" in payload.className:
            sem = 3
        elif "III-" in payload.className or payload.className == "III" or "3" in payload.className:
            sem = 5
        elif "IV-" in payload.className or payload.className == "IV" or "4" in payload.className:
            sem = 7

    tt = db.scalars(
        select(Timetable).where(
            Timetable.department_id == user.department_id,
            Timetable.semester == sem
        ).order_by(Timetable.effective_from.desc(), Timetable.id.desc())
    ).first()

    if not tt:
        tt = Timetable(
            department_id=user.department_id,
            semester=sem,
            section=None,
            hall=payload.hall,
            effective_from=date.today(),
        )
        db.add(tt)
        db.flush()
    else:
        tt.hall = payload.hall
        db.query(TimetableEntry).filter(TimetableEntry.timetable_id == tt.id).delete()
        db.flush()

    for day in payload.days:
        for slot in day.hours:
            if slot.isFree:
                continue
            entry = TimetableEntry(
                timetable_id=tt.id,
                department_id=user.department_id,
                semester=sem,
                section=None,
                weekday=day.weekday,
                period=slot.period or slot.hour,
                start_time=slot.startTime or "09:20",
                end_time=slot.endTime or "10:10",
                subject_id=slot.subjectCode,
                label=slot.subjectName,
                staff_name=slot.staffName,
            )
            db.add(entry)
    db.commit()
    return {"ok": True, "message": "Timetable saved successfully.", "className": payload.className, "hall": payload.hall}
