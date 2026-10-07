"""Append-only audit trail. Only insert; there is deliberately no update or delete helper.
Action names match the kiosk's activity log screen."""
import json

from sqlalchemy.orm import Session

from .models import AuditLog, User

REQUEST_SUBMIT = "REQUEST_SUBMIT"
COUNSELLOR_REASSIGN = "COUNSELLOR_REASSIGN"
STUDENT_ASSIGN = "STUDENT_ASSIGN"
STUDENT_UNASSIGN = "STUDENT_UNASSIGN"
NOTICE_CREATE = "NOTICE_CREATE"
NOTICE_WITHDRAW = "NOTICE_WITHDRAW"
STUDENTS_IMPORT = "STUDENTS_IMPORT"
# Server-side extras (security events)
ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
PASSWORD_CHANGED = "PASSWORD_CHANGED"
NOTICE_PIN = "NOTICE_PIN"
# COUNSELLOR_APPROVE / COUNSELLOR_REJECT / HOD_APPROVE / HOD_REJECT come from leave_workflow.action_name


def log(db: Session, actor: User | None, action: str, *, target_type: str | None = None,
        target_id: int | str | None = None, detail: dict | None = None) -> None:
    """Adds a row to the current transaction (the caller commits). Keep `detail` free of personal data."""
    db.add(AuditLog(
        actor_id=actor.id if actor else None,
        actor_role=actor.role.value if actor else None,
        department_id=actor.department_id if actor else None,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
        detail=json.dumps(detail, ensure_ascii=False) if detail else None,
    ))
