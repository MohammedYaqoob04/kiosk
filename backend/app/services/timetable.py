"""Timetable retrieval service."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Student, Subject, Timetable, TimetableEntry


@dataclass
class TimetableDayData:
    hall: str | None
    breaks: list[dict] = field(default_factory=list)
    hours: list[dict] = field(default_factory=list)


def get_timetable_for_date(db: Session, st: Student, day: date) -> TimetableDayData:
    """Return timetable for a student on a specific date.

    Saturday, Sunday and dates before effective_from return empty hours.
    Returns hours in period order 1..7 with startTime, endTime, subjectCode (null for label-only),
    subjectName or label, staffName, isFree, plus breaks and hall.
    """
    # Saturday (5) and Sunday (6) return empty hours
    if day.weekday() >= 5:
        return TimetableDayData(hall=None, breaks=[], hours=[])

    # Find the newest timetable whose effective_from is on or before the date
    tt = db.scalars(
        select(Timetable)
        .where(
            Timetable.department_id == st.department_id,
            Timetable.semester == st.semester,
            Timetable.effective_from <= day,
        )
        .order_by(Timetable.effective_from.desc(), Timetable.id.desc())
    ).first()

    if not tt:
        # Fallback for loose entries (e.g. legacy/testing without parent Timetable)
        loose_entries = list(db.scalars(
            select(TimetableEntry).where(
                TimetableEntry.timetable_id.is_(None),
                TimetableEntry.department_id == st.department_id,
                TimetableEntry.semester == st.semester,
                TimetableEntry.weekday == day.weekday(),
                (TimetableEntry.section == st.section) | (TimetableEntry.section.is_(None)),
            ).order_by(TimetableEntry.period)
        ))
        if not loose_entries:
            return TimetableDayData(hall=None, breaks=[], hours=[])

        codes = {e.subject_id for e in loose_entries if e.subject_id}
        names = {s.code: s.name for s in db.scalars(select(Subject).where(Subject.code.in_(codes)))} if codes else {}
        hours = []
        for e in loose_entries:
            sub_name = names.get(e.subject_id) if e.subject_id else e.label
            hours.append({
                "hour": e.period,
                "period": e.period,
                "startTime": e.start_time,
                "endTime": e.end_time,
                "subjectCode": e.subject_id,
                "subjectName": sub_name,
                "staffName": e.staff_name,
                "isFree": False,
            })
        return TimetableDayData(hall=None, breaks=[], hours=hours)

    breaks_data = [
        {
            "name": b.name,
            "startTime": b.start_time,
            "endTime": b.end_time,
            "afterPeriod": b.after_period,
            "start": b.start_time,
            "end": b.end_time,
        }
        for b in tt.breaks
    ]

    periods_map = {p.period: (p.start_time, p.end_time) for p in tt.periods}

    entries = list(db.scalars(
        select(TimetableEntry).where(
            TimetableEntry.timetable_id == tt.id,
            TimetableEntry.weekday == day.weekday(),
            (TimetableEntry.section == st.section) | (TimetableEntry.section.is_(None)),
        )
    ))

    # If the student's section has no slots on this weekday and section is specified:
    if not entries and st.section is not None:
        any_day_entries = list(db.scalars(
            select(TimetableEntry).where(
                TimetableEntry.timetable_id == tt.id,
                TimetableEntry.weekday == day.weekday(),
            )
        ))
        if any_day_entries:
            return TimetableDayData(hall=tt.hall, breaks=breaks_data, hours=[])

    entry_by_period = {e.period: e for e in entries}

    subject_codes = {e.subject_id for e in entries if e.subject_id}
    subject_names = {s.code: s.name for s in db.scalars(select(Subject).where(Subject.code.in_(subject_codes)))} if subject_codes else {}

    hours = []
    num_periods = max(max(periods_map.keys(), default=7), 7)
    for p in range(1, num_periods + 1):
        p_start, p_end = periods_map.get(p, (None, None))
        if p in entry_by_period:
            e = entry_by_period[p]
            code = e.subject_id
            name = e.label if code is None else subject_names.get(code, e.label)
            staff = e.staff_name
            is_free = False
            start_t = e.start_time or p_start
            end_t = e.end_time or p_end
        else:
            code = None
            name = None
            staff = None
            is_free = True
            start_t = p_start
            end_t = p_end

        hours.append({
            "hour": p,
            "period": p,
            "startTime": start_t,
            "endTime": end_t,
            "subjectCode": code,
            "subjectName": name,
            "staffName": staff,
            "isFree": is_free,
        })

    return TimetableDayData(hall=tt.hall, breaks=breaks_data, hours=hours)


WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def get_weekly_timetable(db: Session, st: Student) -> list[dict]:
    """Return full weekly timetable (Monday - Saturday) for student."""
    tt = db.scalars(
        select(Timetable)
        .where(
            Timetable.department_id == st.department_id,
            Timetable.semester == st.semester,
        )
        .order_by(Timetable.effective_from.desc(), Timetable.id.desc())
    ).first()

    breaks_data = [
        {
            "name": b.name,
            "startTime": b.start_time,
            "endTime": b.end_time,
            "afterPeriod": b.after_period,
            "start": b.start_time,
            "end": b.end_time,
        }
        for b in tt.breaks
    ] if tt else []

    periods_map = {p.period: (p.start_time, p.end_time) for p in tt.periods} if tt else {}
    num_periods = max(max(periods_map.keys(), default=7), 7)

    all_entries = list(db.scalars(
        select(TimetableEntry).where(
            (TimetableEntry.timetable_id == tt.id) if tt else TimetableEntry.timetable_id.is_(None),
            TimetableEntry.department_id == st.department_id,
            TimetableEntry.semester == st.semester,
            (TimetableEntry.section == st.section) | (TimetableEntry.section.is_(None)),
        )
    )) if tt else []

    subject_codes = {e.subject_id for e in all_entries if e.subject_id}
    subject_names = {s.code: s.name for s in db.scalars(select(Subject).where(Subject.code.in_(subject_codes)))} if subject_codes else {}

    result = []
    for weekday_idx, day_name in enumerate(WEEKDAY_NAMES):
        day_entries = [e for e in all_entries if e.weekday == weekday_idx]
        entry_by_period = {e.period: e for e in day_entries}

        hours = []
        for p in range(1, num_periods + 1):
            p_start, p_end = periods_map.get(p, (None, None))
            if p in entry_by_period:
                e = entry_by_period[p]
                code = e.subject_id
                name = e.label if code is None else subject_names.get(code, e.label)
                staff = e.staff_name
                is_free = False
                start_t = e.start_time or p_start
                end_t = e.end_time or p_end
                room = tt.hall if tt else None
            else:
                code = None
                name = None
                staff = None
                is_free = True
                start_t = p_start
                end_t = p_end
                room = None

            hours.append({
                "hour": p,
                "period": p,
                "time": f"{start_t} - {end_t}" if start_t and end_t else f"Period {p}",
                "startTime": start_t,
                "endTime": end_t,
                "subjectCode": code,
                "subjectName": name,
                "staffName": staff,
                "room": room,
                "isFree": is_free,
            })

        result.append({
            "dayName": day_name,
            "weekday": weekday_idx,
            "hall": tt.hall if tt else None,
            "breaks": breaks_data,
            "hours": hours,
        })
    return result
