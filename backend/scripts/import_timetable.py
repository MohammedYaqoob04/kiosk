"""Import class timetable grid from Excel workbook into database.

Usage:
    python -m scripts.import_timetable --file private_data/timetable.xlsx [--dry-run]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.importers.timetable_sheet import parse
from app.models import Department, Subject, Timetable, TimetableBreak, TimetableEntry, TimetablePeriod


def resolve_faculty(slot, parsed) -> str | None:
    if slot.subject_code and slot.subject_code in parsed.subjects:
        return parsed.subjects[slot.subject_code][1]
    if slot.label in parsed.other_faculty:
        return parsed.other_faculty[slot.label]
    for k, v in parsed.other_faculty.items():
        if k.lower().startswith(slot.label.lower()) or slot.label.lower().startswith(k.lower()):
            return v
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Import class timetable grid from Excel workbook.")
    parser.add_argument("--file", "-f", required=True, type=Path, help="Path to timetable Excel file.")
    parser.add_argument("--dry-run", action="store_true", help="Parse and validate without committing changes.")
    args = parser.parse_args()

    if not args.file.is_file():
        print(f"File not found: {args.file}", file=sys.stderr)
        return 1

    parsed = parse(args.file)
    if parsed.errors:
        print(f"Refusing to run: {len(parsed.errors)} error(s) found:", file=sys.stderr)
        for err in parsed.errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    with SessionLocal() as db:
        dept = db.scalar(
            select(Department).where(
                (Department.code == parsed.department_code)
                | (Department.code == "AI&DS" if parsed.department_code == "AIDS" else False)
            )
        )
        if not dept:
            dept = db.scalar(select(Department).where(Department.code.ilike(parsed.department_code)))
        if not dept:
            print(f"Department not found for code: {parsed.department_code!r}", file=sys.stderr)
            return 1

        try:
            # Replaces the timetable for that department + semester + effective_from in one transaction
            existing_timetables = list(db.scalars(
                select(Timetable).where(
                    Timetable.department_id == dept.id,
                    Timetable.semester == parsed.semester,
                    Timetable.effective_from == parsed.effective_from,
                )
            ))
            for old_tt in existing_timetables:
                db.delete(old_tt)
            db.flush()

            tt = Timetable(
                department_id=dept.id,
                semester=parsed.semester,
                section=None,
                hall=parsed.hall,
                effective_from=parsed.effective_from,
            )
            db.add(tt)
            db.flush()

            # Periods
            for period_num, (start_t, end_t) in parsed.periods.items():
                db.add(TimetablePeriod(
                    timetable_id=tt.id,
                    period=period_num,
                    start_time=start_t,
                    end_time=end_t,
                ))

            # Breaks
            for b_name, b_start, b_end, after_p in parsed.breaks:
                db.add(TimetableBreak(
                    timetable_id=tt.id,
                    name=b_name,
                    start_time=b_start,
                    end_time=b_end,
                    after_period=after_p,
                ))

            # Upsert subjects (code, name, department, semester)
            for code, (sub_name, _) in parsed.subjects.items():
                sub = db.get(Subject, code)
                if sub:
                    sub.name = sub_name
                    sub.department_id = dept.id
                    sub.semester = parsed.semester
                else:
                    db.add(Subject(
                        code=code,
                        name=sub_name,
                        department_id=dept.id,
                        semester=parsed.semester,
                    ))

            # Slots (classes)
            for slot in parsed.slots:
                faculty = resolve_faculty(slot, parsed)
                p_start, p_end = parsed.periods.get(slot.period, (None, None))
                db.add(TimetableEntry(
                    timetable_id=tt.id,
                    department_id=dept.id,
                    semester=parsed.semester,
                    section=None,
                    weekday=slot.weekday,
                    period=slot.period,
                    start_time=p_start,
                    end_time=p_end,
                    subject_id=slot.subject_code,
                    label=slot.label,
                    staff_name=faculty,
                ))

            if args.dry_run:
                db.rollback()
            else:
                db.commit()
        except Exception as e:
            db.rollback()
            print(f"Database error during import: {e}", file=sys.stderr)
            return 1

    print(f"Periods: {len(parsed.periods)}")
    print(f"Classes: {len(parsed.slots)}")
    print(f"Free periods: {len(parsed.free_periods)}")
    print(f"Subjects: {len(parsed.subjects)}")
    if args.dry_run:
        print("Dry run completed: no database changes committed.")
    else:
        print("Timetable imported successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
