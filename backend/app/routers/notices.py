"""Notices and circulars: counsellors and HODs send; students (and counsellors, for HOD notices) read."""
import re
from datetime import date, datetime, time, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import audit
from ..config import get_settings
from ..database import get_db
from ..deps import current_user, not_found, require_roles
from ..enums import AudienceType, NoticeCategory, Role
from ..models import (
    Notice, NoticeAttachment, NoticeRecipient, Student, User, utcnow,
)
from ..services import files as filesvc

router = APIRouter(prefix="/notices", tags=["notices"])
Author = Depends(require_roles(Role.COUNSELLOR, Role.HOD))


def _end_of_day_utc(d: date) -> datetime:
    local = datetime.combine(d, time(23, 59, 59), tzinfo=ZoneInfo(get_settings().timezone))
    return local.astimezone(timezone.utc).replace(tzinfo=None)


def _active(now: datetime):
    return (Notice.withdrawn_at.is_(None)) & ((Notice.expires_at.is_(None)) | (Notice.expires_at > now))


def _attachment_out(a: NoticeAttachment) -> dict:
    return {"id": a.id, "name": a.filename, "type": a.content_type, "size": a.size_bytes,
            "url": f"/api/v1/notices/{a.notice_id}/attachments/{a.id}"}


def _audience_string(n: Notice) -> str:
    if n.audience_type == AudienceType.SELECTED_STUDENTS:
        return f"SELECTED_STUDENTS:{n.audience_value or ''}"
    if n.audience_type == AudienceType.SECTION:
        return f"SECTION:{n.audience_value or ''}"
    return n.audience_type.value


def parse_audience(text: str) -> tuple[AudienceType, str | None, list[str]]:
    """The kiosk's audience strings: MY_STUDENTS | ALL_STUDENTS | ALL_COUNSELLORS | SECTION:A |
    SELECTED_STUDENTS:5104...,5104..."""
    kind, _, value = text.strip().partition(":")
    try:
        atype = AudienceType(kind)
    except ValueError:
        raise HTTPException(422, {"code": "INVALID", "message": "Unknown audience."})
    value = value.strip()
    if atype == AudienceType.SECTION:
        if not re.fullmatch(r"[A-Za-z0-9]{1,5}", value):
            raise HTTPException(422, {"code": "INVALID", "message": "Choose a section."})
        return atype, value.upper(), []
    if atype == AudienceType.SELECTED_STUDENTS:
        regs = sorted({r.strip() for r in value.split(",") if r.strip()})
        if not regs or not all(re.fullmatch(r"\d{12}", r) for r in regs):
            raise HTTPException(422, {"code": "INVALID", "message": "Pick at least one student."})
        return atype, ",".join(regs), regs
    if value:
        raise HTTPException(422, {"code": "INVALID", "message": "Unknown audience."})
    return atype, None, []


def _resolve_recipients(db: Session, user: User, atype: AudienceType, value: str | None,
                        reg_nos: list[str]) -> list[int]:
    """Returns the recipient USER ids, enforcing who may address whom."""
    if user.role == Role.COUNSELLOR:
        if atype == AudienceType.MY_STUDENTS:
            sts = db.scalars(select(Student).where(Student.counsellor_id == user.id)).all()
        elif atype == AudienceType.SELECTED_STUDENTS:
            sts = db.scalars(select(Student).where(Student.register_no.in_(reg_nos),
                                                   Student.counsellor_id == user.id)).all()
            if len(sts) != len(set(reg_nos)):
                raise HTTPException(403, {"code": "FORBIDDEN", "message": "You can only address your own students."})
        else:
            raise HTTPException(403, {"code": "FORBIDDEN", "message": "Counsellors can only write to their own students."})
        return [s.user_id for s in sts]

    # HOD (department only)
    dept = Student.department_id == user.department_id
    if atype == AudienceType.ALL_STUDENTS:
        return list(db.scalars(select(Student.user_id).where(dept)))
    if atype == AudienceType.SECTION:
        if not value or not value.strip():
            raise HTTPException(422, {"code": "INVALID", "message": "Choose a section."})
        return list(db.scalars(select(Student.user_id).where(dept, Student.section == value.strip().upper())))
    if atype == AudienceType.SELECTED_STUDENTS:
        ids = list(db.scalars(select(Student.user_id).where(dept, Student.register_no.in_(reg_nos))))
        if len(ids) != len(set(reg_nos)):
            raise HTTPException(403, {"code": "FORBIDDEN", "message": "Some students are not in your department."})
        return ids
    if atype == AudienceType.ALL_COUNSELLORS:
        return list(db.scalars(select(User.id).where(
            User.role == Role.COUNSELLOR, User.department_id == user.department_id, User.is_active.is_(True))))
    raise HTTPException(403, {"code": "FORBIDDEN", "message": "HODs cannot use this audience."})


MAX_TOTAL_ATTACHMENTS_BYTES = 4 * 1024 * 1024


@router.post("", status_code=201)
async def create_notice(
    title: str = Form(..., max_length=200),
    body: str = Form(..., max_length=5000),
    category: NoticeCategory = Form(...),
    audience: str = Form(..., max_length=2000),
    expires_on: date | None = Form(None, alias="expiresAt"),
    pinned: bool = Form(False),
    files: list[UploadFile] = File(default=[]),
    user: User = Author,
    db: Session = Depends(get_db),
):
    s = get_settings()
    title, body = title.strip(), body.strip()
    if not 1 <= len(title) <= 80:
        raise HTTPException(422, {"code": "INVALID", "message": "Title must be 1 to 80 characters."})
    if not 1 <= len(body) <= 1500:
        raise HTTPException(422, {"code": "INVALID", "message": "Message must be 1 to 1500 characters."})
    if pinned and user.role != Role.HOD:
        raise HTTPException(403, {"code": "FORBIDDEN", "message": "Only the HOD can pin a notice."})
    if expires_on and expires_on < date.today():
        raise HTTPException(422, {"code": "INVALID", "message": "The expiry date is in the past."})

    audience_type, audience_value, reg_nos = parse_audience(audience)
    recipients = _resolve_recipients(db, user, audience_type, audience_value, reg_nos)
    if not recipients:
        raise HTTPException(422, {"code": "NO_RECIPIENTS", "message": "There is nobody to send this to."})

    # Validate every file BEFORE saving any, so a bad file leaves nothing behind.
    uploads = [f for f in files if f.filename or f.size]
    if len(uploads) > s.max_attachments:
        raise HTTPException(422, {"code": "TOO_MANY_FILES", "message": f"Attach at most {s.max_attachments} files."})
    raw_files = []
    total_bytes = 0
    for f in uploads:
        data = await f.read(MAX_TOTAL_ATTACHMENTS_BYTES + 1)
        total_bytes += len(data)
        raw_files.append((f, data))

    if total_bytes > MAX_TOTAL_ATTACHMENTS_BYTES:
        raise HTTPException(422, {"code": "TOO_LARGE", "message": "Total attachments must be 4 MB or smaller."})

    checked = []
    for f, data in raw_files:
        try:
            checked.append((*filesvc.validate_upload(f.filename, data), data))
        except filesvc.UploadError as e:
            raise HTTPException(422, {"code": "BAD_FILE", "message": f"{f.filename or 'File'}: {e}"})

    notice = Notice(title=title, body=body, category=category, audience_type=audience_type,
                    audience_value=audience_value, author_id=user.id,
                    department_id=user.department_id, pinned=pinned,
                    expires_at=_end_of_day_utc(expires_on) if expires_on else None)
    db.add(notice)
    db.flush()
    for uid in sorted(set(recipients)):
        db.add(NoticeRecipient(notice_id=notice.id, user_id=uid))
    for name, ctype, ext, data in checked:
        db.add(NoticeAttachment(notice_id=notice.id, filename=name, content_type=ctype,
                                size_bytes=len(data), file_id=filesvc.store(db, data, ctype)))
    audit.log(db, user, audit.NOTICE_CREATE, target_type="notice", target_id=notice.id,
              detail={"audience": audience_type.value, "recipients": len(set(recipients)),
                      "category": category.value})
    db.commit()
    return {"id": notice.id, "recipientCount": len(set(recipients))}


@router.get("/inbox")
def inbox(category: NoticeCategory | None = None, user: User = Depends(current_user),
          db: Session = Depends(get_db)):
    """Notices addressed to the signed-in user: pinned first, then newest first."""
    q = select(Notice, NoticeRecipient).join(NoticeRecipient, NoticeRecipient.notice_id == Notice.id).where(
        NoticeRecipient.user_id == user.id, _active(utcnow()))
    if category:
        q = q.where(Notice.category == category)
    q = q.order_by(Notice.pinned.desc(), Notice.created_at.desc(), Notice.id.desc())
    return [{"id": n.id, "title": n.title, "body": n.body, "category": n.category.value,
             "authorName": n.author.full_name, "authorRole": n.author.role.value,
             "createdAt": n.created_at.isoformat(),
             "expiresAt": n.expires_at.isoformat() if n.expires_at else None,
             "audience": _audience_string(n), "pinned": n.pinned, "unread": rec.read_at is None,
             "attachments": [_attachment_out(a) for a in n.attachments]}
            for n, rec in db.execute(q)]


@router.get("/unread-count")
def unread_count(user: User = Depends(current_user), db: Session = Depends(get_db)):
    n = db.scalar(select(func.count()).select_from(Notice).join(
        NoticeRecipient, NoticeRecipient.notice_id == Notice.id).where(
        NoticeRecipient.user_id == user.id, NoticeRecipient.read_at.is_(None), _active(utcnow())))
    return {"unread": n or 0}


@router.post("/{notice_id}/read", status_code=204)
def mark_read(notice_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    rec = db.scalar(select(NoticeRecipient).where(
        NoticeRecipient.notice_id == notice_id, NoticeRecipient.user_id == user.id))
    if rec is None:
        raise not_found("Notice not found.")
    if rec.read_at is None:
        rec.read_at = utcnow()
        db.commit()


@router.get("/sent")
def sent(user: User = Author, db: Session = Depends(get_db)):
    out = []
    now = utcnow()
    for n in db.scalars(select(Notice).where(Notice.author_id == user.id)
                        .order_by(Notice.created_at.desc(), Notice.id.desc())):
        total = db.scalar(select(func.count()).select_from(NoticeRecipient).where(NoticeRecipient.notice_id == n.id))
        read = db.scalar(select(func.count()).select_from(NoticeRecipient).where(
            NoticeRecipient.notice_id == n.id, NoticeRecipient.read_at.is_not(None)))
        out.append({"id": n.id, "title": n.title, "category": n.category.value,
                    "audience": _audience_string(n),
                    "createdAt": n.created_at.isoformat(), "pinned": n.pinned,
                    "withdrawn": n.withdrawn_at is not None,
                    "expired": bool(n.expires_at and n.expires_at <= now),
                    "recipientCount": total or 0, "readCount": read or 0,
                    "attachments": [_attachment_out(a) for a in n.attachments]})
    return out


def _own_notice(db: Session, user: User, notice_id: int) -> Notice:
    n = db.get(Notice, notice_id)
    if n is None or n.author_id != user.id:
        raise not_found("Notice not found.")
    return n


@router.post("/{notice_id}/withdraw")
def withdraw(notice_id: int, user: User = Author, db: Session = Depends(get_db)):
    n = _own_notice(db, user, notice_id)
    if n.withdrawn_at is None:
        n.withdrawn_at = utcnow()
        audit.log(db, user, audit.NOTICE_WITHDRAW, target_type="notice", target_id=n.id)
        db.commit()
    return {"id": n.id, "withdrawn": True}


class PinIn(BaseModel):
    pinned: bool


@router.post("/{notice_id}/pin")
def pin(notice_id: int, body: PinIn, user: User = Depends(require_roles(Role.HOD)), db: Session = Depends(get_db)):
    n = _own_notice(db, user, notice_id)
    n.pinned = body.pinned
    audit.log(db, user, audit.NOTICE_PIN, target_type="notice", target_id=n.id, detail={"pinned": body.pinned})
    db.commit()
    return {"id": n.id, "pinned": n.pinned}


@router.get("/{notice_id}/attachments/{attachment_id}")
def download(notice_id: int, attachment_id: int, user: User = Depends(current_user),
             db: Session = Depends(get_db)):
    """Open with fetch() + the login token (a plain link cannot send it), then show from a blob URL."""
    att = db.get(NoticeAttachment, attachment_id)
    n = db.get(Notice, notice_id)
    if att is None or n is None or att.notice_id != n.id:
        raise not_found("File not found.")
    is_author = n.author_id == user.id
    is_dept_hod = user.role == Role.HOD and n.department_id == user.department_id
    rec = db.scalar(select(NoticeRecipient).where(
        NoticeRecipient.notice_id == n.id, NoticeRecipient.user_id == user.id))
    now = utcnow()
    live = n.withdrawn_at is None and not (n.expires_at and n.expires_at <= now)
    if not (is_author or is_dept_hod or (rec is not None and live)):
        raise not_found("File not found.")
    resp = filesvc.file_response(db, att.file_id, att.filename)
    if resp is None:
        raise not_found("File not found.")
    return resp
