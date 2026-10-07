"""Read-only view of the audit trail. There are no write endpoints on purpose."""
import json
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_roles
from ..enums import Role
from ..models import AuditLog, User

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
def list_audit(action: str | None = None, from_: date | None = Query(None, alias="from"),
               to: date | None = None, limit: int = Query(200, ge=1, le=1000),
               user: User = Depends(require_roles(Role.COUNSELLOR, Role.HOD)), db: Session = Depends(get_db)):
    q = select(AuditLog, User).outerjoin(User, User.id == AuditLog.actor_id)
    if user.role == Role.COUNSELLOR:
        q = q.where(AuditLog.actor_id == user.id)  # a counsellor sees only their own entries
    else:
        q = q.where(AuditLog.department_id == user.department_id)
    if action:
        q = q.where(AuditLog.action == action)
    if from_:
        q = q.where(AuditLog.at >= datetime.combine(from_, time.min))
    if to:
        q = q.where(AuditLog.at < datetime.combine(to + timedelta(days=1), time.min))
    out = []
    for row, actor in db.execute(q.order_by(AuditLog.id.desc()).limit(limit)):
        detail = json.loads(row.detail) if row.detail else {}
        out.append({"id": str(row.id), "actor": actor.full_name if actor else "system", "role": row.actor_role,
                    "action": row.action, "targetId": row.target_id or "", "time": row.at.isoformat(),
                    **({"reason": detail["reason"]} if detail.get("reason") else {})})
    return out
