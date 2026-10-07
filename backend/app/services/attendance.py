"""Attendance percentages. Present = P or OD (on duty)."""
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..enums import AttendanceStatus
from ..models import AttendanceRecord


def percent(present: int, total: int) -> float | None:
    return round(100 * present / total, 2) if total else None


def attendance_by_student(db: Session, student_ids: list[int]) -> dict[int, float | None]:
    """{student_id: percent or None when there are no records}."""
    if not student_ids:
        return {}
    present_expr = func.sum(case((AttendanceRecord.status.in_(
        [AttendanceStatus.PRESENT, AttendanceStatus.OD]), 1), else_=0))
    rows = db.execute(
        select(AttendanceRecord.student_id, present_expr, func.count())
        .where(AttendanceRecord.student_id.in_(student_ids))
        .group_by(AttendanceRecord.student_id)).all()
    result: dict[int, float | None] = {sid: None for sid in student_ids}
    for sid, present, total in rows:
        result[sid] = percent(int(present or 0), int(total))
    return result


def is_below_min(pct: float | None) -> bool:
    return pct is not None and pct < get_settings().attendance_min_percent
