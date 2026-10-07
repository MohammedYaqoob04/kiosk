"""Leave / OD requests and the two-step approval (Counsellor, then HOD).

Field names, categories, limits and statuses mirror the kiosk screens (src/types/leave.ts).
"""
from datetime import date, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..config import get_settings
from ..database import get_db
from ..deps import current_user, not_found, require_roles, student_of
from ..enums import Decision, LeaveCategory, LeaveStatus, LeaveType, OdCategory, Role, Stage
from ..models import LeaveAction, LeaveRequest, Student, User, utcnow
from ..services import files as filesvc
from ..services.attendance import attendance_by_student, is_below_min
from ..services.leave_workflow import (
    ACTIVE, FINISHED, MIN_REASON_LENGTH, PENDING, STAGE_OF_STATUS, InvalidTransition, action_name, next_status,
)

router = APIRouter(prefix="/leave", tags=["leave"])
StaffUser = Depends(require_roles(Role.COUNSELLOR, Role.HOD))
MIN_LEAVE_REASON = 10


class DecisionIn(BaseModel):
    decision: Decision
    remark: str | None = Field(None, max_length=300)


class ReassignIn(BaseModel):
    counsellor_id: str = Field(alias="counsellorId", min_length=1, max_length=40)  # a staff ID
    model_config = {"populate_by_name": True}


def bad(message: str, code: str = "INVALID", status: int = 422) -> HTTPException:
    return HTTPException(status, {"code": code, "message": message})


def _decision(lr: LeaveRequest, stage: Stage) -> dict | None:
    a = next((a for a in lr.actions if a.stage == stage), None)
    if a is None:
        return None
    out = {"by": a.actor.full_name, "byId": a.actor.username, "at": a.at.isoformat()}
    if a.remark:
        out["remark"] = a.remark
    return out


def serialize_leave(db: Session, lr: LeaveRequest, *, context: bool = False) -> dict:
    st = lr.student
    rejection = next((a.remark for a in reversed(lr.actions) if a.decision == Decision.REJECT), None)
    last_at = lr.actions[-1].at if lr.actions else lr.created_at
    out = {
        "id": str(lr.id), "kind": lr.type.value, "category": lr.category, "status": lr.status.value,
        "studentRegNo": st.register_no, "studentName": st.user.full_name,
        "departmentCode": st.department.code, "section": st.section,
        "fromDate": lr.from_date.isoformat(), "toDate": lr.to_date.isoformat(), "days": lr.days,
        "createdAt": lr.created_at.isoformat(),
        "counsellorId": lr.counsellor.username, "counsellorName": lr.counsellor.full_name,
        "counsellorDecision": _decision(lr, Stage.COUNSELLOR), "hodDecision": _decision(lr, Stage.HOD),
        "reason": lr.reason, "residentialAddress": lr.address,
        "eventName": lr.event_name, "organizer": lr.organizer, "venue": lr.venue,
        "letter": ({"name": lr.letter_name, "type": lr.letter_type, "size": lr.letter_size,
                    "url": f"/api/v1/leave/{lr.id}/letter"} if lr.letter_file_id else None),
        "rejectionReason": rejection,
        "waitingDays": (utcnow() - last_at).days if lr.status in PENDING else None,
    }
    if context:  # extra information that helps an approver decide
        pct = attendance_by_student(db, [st.id]).get(st.id)
        recent = db.scalars(select(LeaveRequest).where(
            LeaveRequest.student_id == st.id, LeaveRequest.id != lr.id)
            .order_by(LeaveRequest.created_at.desc()).limit(3)).all()
        out["attendancePercentage"] = pct
        out["belowMinAttendance"] = is_below_min(pct)
        out["recentRequests"] = [{"id": str(r.id), "kind": r.type.value, "category": r.category,
                                  "status": r.status.value, "fromDate": r.from_date.isoformat(),
                                  "toDate": r.to_date.isoformat()} for r in recent]
    return out


def _in_scope(user: User, lr: LeaveRequest) -> bool:
    if user.role == Role.STUDENT:
        return lr.student.user_id == user.id
    if user.role == Role.COUNSELLOR:
        return lr.counsellor_id == user.id or any(a.actor_id == user.id for a in lr.actions)
    if user.role == Role.HOD:
        return lr.student.department_id == user.department_id
    return False


@router.post("", status_code=201)
async def create_leave(
    kind: LeaveType = Form(...),
    category: str = Form(..., max_length=40),
    from_date: date = Form(..., alias="fromDate"),
    to_date: date = Form(..., alias="toDate"),
    reason: str | None = Form(None, max_length=500),
    residential_address: str | None = Form(None, alias="residentialAddress", max_length=300),
    event_name: str | None = Form(None, alias="eventName", max_length=150),
    organizer: str | None = Form(None, max_length=150),
    venue: str | None = Form(None, max_length=150),
    letter: UploadFile | None = File(None),
    user: User = Depends(require_roles(Role.STUDENT)),
    db: Session = Depends(get_db),
):
    """multipart/form-data (so the OD letter can travel with the form)."""
    s = get_settings()
    st = student_of(db, user)
    if st.counsellor_id is None:
        raise bad("No counsellor is assigned to you yet. Please contact your HOD.", "NO_COUNSELLOR", 409)
    if to_date < from_date:
        raise bad("To date must be the same as or after the from date.")
    days = (to_date - from_date).days + 1
    if s.leave_max_days is not None and days > s.leave_max_days:
        raise bad(f"A request can be at most {s.leave_max_days} days.", "TOO_LONG")
    if s.leave_max_past_days is not None and from_date < date.today() - timedelta(days=s.leave_max_past_days):
        raise bad("This start date is too far in the past.", "TOO_OLD")

    reason = (reason or "").strip() or None
    event_name, organizer, venue = [(v or "").strip() or None for v in (event_name, organizer, venue)]
    letter_info = None
    if kind == LeaveType.LEAVE:
        if category not in {c.value for c in LeaveCategory}:
            raise bad("Choose a leave category.")
        if not reason or len(reason) < MIN_LEAVE_REASON:
            raise bad(f"Leave reason must be at least {MIN_LEAVE_REASON} characters.")
    else:
        if category not in {c.value for c in OdCategory}:
            raise bad("Choose an OD category.")
        if not (event_name and organizer and venue):
            raise bad("Event name, organizer, and venue are required for OD.")
        if letter is None or not (letter.filename or letter.size):
            raise bad("Upload the official OD letter (PDF, JPG or PNG).", "LETTER_REQUIRED")
        data = await letter.read(s.max_upload_bytes + 1)
        try:
            letter_info = (*filesvc.validate_upload(letter.filename, data), data)
        except filesvc.UploadError as e:
            raise bad(f"OD letter: {e}", "BAD_FILE")

    if s.block_overlapping_leave:
        clash = db.scalar(select(LeaveRequest.id).where(
            LeaveRequest.student_id == st.id, LeaveRequest.status.in_(ACTIVE),
            LeaveRequest.from_date <= to_date, LeaveRequest.to_date >= from_date))
        if clash:
            raise bad("You already have a request for these dates.", "OVERLAP", 409)

    lr = LeaveRequest(student_id=st.id, counsellor_id=st.counsellor_id, type=kind, category=category,
                      from_date=from_date, to_date=to_date, days=days, reason=reason,
                      address=(residential_address or "").strip() or None, event_name=event_name,
                      organizer=organizer, venue=venue, status=LeaveStatus.PENDING_COUNSELLOR)
    if letter_info:
        name, ctype, ext, data = letter_info
        lr.letter_name, lr.letter_type, lr.letter_size = name, ctype, len(data)
        lr.letter_file_id = filesvc.store(db, data, ctype)
    db.add(lr)
    db.flush()
    audit.log(db, user, audit.REQUEST_SUBMIT, target_type="leave_request", target_id=lr.id,
              detail={"kind": kind.value, "days": days})
    db.commit()
    return serialize_leave(db, lr)


@router.get("/mine")
def my_requests(user: User = Depends(require_roles(Role.STUDENT)), db: Session = Depends(get_db)):
    st = student_of(db, user)
    rows = db.scalars(select(LeaveRequest).where(LeaveRequest.student_id == st.id)
                      .order_by(LeaveRequest.created_at.desc(), LeaveRequest.id.desc())).all()
    return [serialize_leave(db, r) for r in rows]


@router.get("/queue")
def queue(user: User = StaffUser, db: Session = Depends(get_db)):
    """Counsellor: own students' requests waiting for them. HOD: department requests waiting for the HOD.
    The signed-in user decides, never a counsellorId sent by the browser."""
    q = select(LeaveRequest)
    if user.role == Role.COUNSELLOR:
        q = q.where(LeaveRequest.status == LeaveStatus.PENDING_COUNSELLOR, LeaveRequest.counsellor_id == user.id)
    else:
        q = q.join(Student, Student.id == LeaveRequest.student_id).where(
            LeaveRequest.status == LeaveStatus.PENDING_HOD, Student.department_id == user.department_id)
    rows = db.scalars(q.order_by(LeaveRequest.created_at, LeaveRequest.id)).all()  # oldest first
    return [serialize_leave(db, r, context=True) for r in rows]


@router.get("/history")
def history(filter: Literal["ALL", "APPROVED", "REJECTED"] = "ALL",
            user: User = StaffUser, db: Session = Depends(get_db)):
    """Decisions made: by this counsellor, or at the HOD stage for the department."""
    q = select(LeaveAction).join(LeaveRequest, LeaveRequest.id == LeaveAction.request_id)
    if user.role == Role.COUNSELLOR:
        q = q.where(LeaveAction.actor_id == user.id)
    else:
        q = q.join(Student, Student.id == LeaveRequest.student_id).where(
            LeaveAction.stage == Stage.HOD, Student.department_id == user.department_id)
    if filter == "APPROVED":
        q = q.where(LeaveAction.decision == Decision.APPROVE)
    elif filter == "REJECTED":
        q = q.where(LeaveAction.decision == Decision.REJECT)
    out = []
    for a in db.scalars(q.order_by(LeaveAction.at.desc(), LeaveAction.id.desc()).limit(300)):
        out.append({"id": str(a.id), "request": serialize_leave(db, a.request, context=True),
                    "decision": "APPROVED" if a.decision == Decision.APPROVE else "REJECTED",
                    "decidedAt": a.at.isoformat(), "remark": a.remark})
    return out


@router.get("/{leave_id}")
def get_leave(leave_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    lr = db.get(LeaveRequest, leave_id)
    if lr is None or not _in_scope(user, lr):
        raise not_found("Request not found.")
    return serialize_leave(db, lr, context=user.role in (Role.COUNSELLOR, Role.HOD))


@router.get("/{leave_id}/letter")
def get_letter(leave_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """The uploaded OD letter. Open with fetch() + the login token, then show it from a blob URL."""
    lr = db.get(LeaveRequest, leave_id)
    if lr is None or not _in_scope(user, lr):
        raise not_found("Letter not found.")
    resp = filesvc.file_response(db, lr.letter_file_id, lr.letter_name or "letter")
    if resp is None:
        raise not_found("Letter not found.")
    return resp


@router.post("/{leave_id}/decision")
def decide(leave_id: int, body: DecisionIn, user: User = StaffUser, db: Session = Depends(get_db)):
    lr = db.scalar(select(LeaveRequest).where(LeaveRequest.id == leave_id).with_for_update())
    if lr is None or not _in_scope(user, lr):
        raise not_found("Request not found.")
    # A counsellor may only decide requests assigned to THEM (history access is not enough).
    if user.role == Role.COUNSELLOR and lr.counsellor_id != user.id:
        raise not_found("Request not found.")
    stage = STAGE_OF_STATUS.get(lr.status)
    try:
        new_status = next_status(lr.status, user.role, body.decision, body.remark)
    except InvalidTransition as e:
        raise HTTPException(422 if e.code == "REASON_REQUIRED" else 409, {"code": e.code, "message": e.message})
    remark = (body.remark or "").strip() or None
    db.add(LeaveAction(request_id=lr.id, stage=stage, decision=body.decision, actor_id=user.id, remark=remark))
    lr.status = new_status
    audit.log(db, user, action_name(stage, body.decision), target_type="leave_request", target_id=lr.id,
              detail={"reason": remark} if body.decision == Decision.REJECT else None)
    db.commit()
    db.refresh(lr)
    return serialize_leave(db, lr, context=True)


@router.post("/{leave_id}/reassign")
def reassign(leave_id: int, body: ReassignIn, user: User = Depends(require_roles(Role.HOD)),
             db: Session = Depends(get_db)):
    lr = db.scalar(select(LeaveRequest).where(LeaveRequest.id == leave_id).with_for_update())
    if lr is None or lr.student.department_id != user.department_id:
        raise not_found("Request not found.")
    if lr.status != LeaveStatus.PENDING_COUNSELLOR:
        raise bad("Only requests pending counsellor review can be reassigned.", "WRONG_STAGE", 409)
    target = db.scalar(select(User).where(User.username == body.counsellor_id.strip().upper()))
    if target is None or target.role != Role.COUNSELLOR or target.department_id != user.department_id or not target.is_active:
        raise bad("Choose a counsellor from your department.")
    old = lr.counsellor.username
    lr.counsellor_id = target.id
    audit.log(db, user, audit.COUNSELLOR_REASSIGN, target_type="leave_request", target_id=lr.id,
              detail={"from": old, "to": target.username})
    db.commit()
    db.refresh(lr)
    return serialize_leave(db, lr, context=True)
