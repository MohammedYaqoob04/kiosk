"""Reads the class timetable grid workbook into plain Python data. No database code in this file.

Layout it expects (matches Arunai_AI_DS_Final_VII_Timetable_Grid_Upload.xlsx):
  rows above 'DAY'      -> Department / Semester (roman) / Hall / Effective From (label in column A, value in B)
  'DAY' row             -> PERIOD 1..7 plus BREAK and LUNCH columns
  'TIME' row            -> '09:20-10:10' style ranges (hyphen or en dash)
  Monday..Friday rows   -> 'CODE / Subject name', or a label such as 'Skill Development', or blank (free period)
  'Code | Subject | Faculty' table below the grid -> faculty per subject
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path

import openpyxl

DAYS = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
DEPARTMENTS = {"artificial intelligence and data science": "AIDS", "ai & ds": "AIDS", "ai&ds": "AIDS"}
CODE_RE = re.compile(r"^[A-Z]{2,4}\d{3,4}$")
TIME_RE = re.compile(r"^(\d{1,2}):(\d{2})\s*[-\u2013\u2014]\s*(\d{1,2}):(\d{2})$")
PLACEHOLDER_FACULTY = {"assigned faculty", "tba", "-", "\u2014", ""}


@dataclass(frozen=True)
class Slot:
    weekday: int  # Monday = 0
    period: int  # 1..7
    subject_code: str | None  # None for Skill Development, Library / Counseling, ...
    label: str  # text to show when there is no subject code (or the subject name)
    subject_name: str | None = None


@dataclass
class ParsedTimetable:
    department_code: str
    semester: int
    hall: str | None
    effective_from: date
    periods: dict[int, tuple[str, str]] = field(default_factory=dict)  # 1 -> ('09:20', '10:10')
    breaks: list[tuple[str, str, str, int]] = field(default_factory=list)  # (name, start, end, after_period)
    slots: list[Slot] = field(default_factory=list)
    subjects: dict[str, tuple[str, str | None]] = field(default_factory=dict)  # code -> (name, faculty)
    other_faculty: dict[str, str | None] = field(default_factory=dict)  # 'Library / Counseling' -> faculty
    free_periods: list[tuple[int, int]] = field(default_factory=list)  # (weekday, period) with no class
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def _clean(value: object) -> str:
    return "" if value is None else re.sub(r"\s+", " ", str(value)).strip()


def _times(text: str) -> tuple[str, str] | None:
    m = TIME_RE.match(_clean(text))
    return (f"{int(m[1]):02d}:{m[2]}", f"{int(m[3]):02d}:{m[4]}") if m else None


def _date(value: object) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(_clean(value), fmt).date()
        except ValueError:
            pass
    return None


def parse(path: str | Path, sheet: str | None = None) -> ParsedTimetable:
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[sheet] if sheet else wb.worksheets[0]
    rows = [[_clean(c) if not isinstance(c, (date, datetime)) else c for c in r] for r in ws.iter_rows(values_only=True)]
    errors: list[str] = []

    meta = {str(r[0]).lower(): r[1] for r in rows if r and r[0] and r[1] not in (None, "") and str(r[0]).lower() in
            ("department", "semester", "hall", "effective from")}
    dept = DEPARTMENTS.get(_clean(meta.get("department")).lower())
    if not dept:
        errors.append(f"Unknown department: {meta.get('department')!r}")
    sem = ROMAN.get(_clean(meta.get("semester")).upper()) or (int(meta["semester"]) if str(meta.get("semester", "")).isdigit() else None)
    if not sem:
        errors.append(f"Semester not understood: {meta.get('semester')!r}")
    eff = _date(meta.get("effective from"))
    if not eff:
        errors.append(f"Effective From is not a date: {meta.get('effective from')!r}")
    out = ParsedTimetable(dept or "", sem or 0, _clean(meta.get("hall")) or None, eff or date.min)

    day_row = next((i for i, r in enumerate(rows) if r and str(r[0]).upper() == "DAY"), None)
    if day_row is None or day_row + 1 >= len(rows) or str(rows[day_row + 1][0]).upper() != "TIME":
        out.errors = errors + ["Could not find the DAY and TIME header rows."]
        return out
    header, time_row = rows[day_row], rows[day_row + 1]

    period_cols: dict[int, int] = {}
    last_period = 0
    for col, name in enumerate(header):
        if col == 0:
            continue
        label = str(name).upper()
        m = re.match(r"^PERIOD\s*(\d+)$", label)
        t = _times(time_row[col]) if col < len(time_row) else None
        if m:
            period_cols[col] = last_period = int(m[1])
            if t:
                out.periods[last_period] = t
            else:
                errors.append(f"Time for {label} is not like 09:20-10:10: {time_row[col]!r}")
        elif label in ("BREAK", "LUNCH") and t:
            out.breaks.append((label.title(), t[0], t[1], last_period))
    if sorted(out.periods) != list(range(1, 8)):
        errors.append(f"Expected PERIOD 1..7, found {sorted(out.periods)}")

    r = day_row + 2
    while r < len(rows) and str(rows[r][0]).lower() in DAYS:
        weekday = DAYS[str(rows[r][0]).lower()]
        for col, period in period_cols.items():
            text = _clean(rows[r][col]) if col < len(rows[r]) else ""
            if not text:
                out.free_periods.append((weekday, period))
                continue
            left, sep, right = text.partition(" / ")
            if sep and CODE_RE.match(left):
                out.slots.append(Slot(weekday, period, left, right.strip(), right.strip()))
            else:
                out.slots.append(Slot(weekday, period, None, text))
        r += 1

    start = next((i for i, row in enumerate(rows) if str(row[0]).lower() == "code"), None)
    if start is not None:
        for row in rows[start + 1:]:
            code, name, faculty = (_clean(row[i]) if i < len(row) else "" for i in range(3))
            if not name:
                continue
            fac = None if faculty.lower() in PLACEHOLDER_FACULTY else faculty
            if CODE_RE.match(code):
                out.subjects[code] = (name, fac)
            else:
                out.other_faculty[name] = fac

    # ---- validation ---------------------------------------------------------------------------------------
    for s in out.slots:
        if s.subject_code:
            if s.subject_code not in out.subjects:
                errors.append(f"{s.subject_code} is in the grid but not in the faculty table.")
            elif out.subjects[s.subject_code][0].lower() != (s.subject_name or "").lower():
                errors.append(f"Name mismatch for {s.subject_code}: grid says {s.subject_name!r}, table says {out.subjects[s.subject_code][0]!r}.")
    used = {s.subject_code for s in out.slots if s.subject_code}
    for code in out.subjects:
        if code not in used:
            out.warnings.append(f"{code} is in the faculty table but never appears in the grid.")
    for day in range(5):
        if not any(s.weekday == day for s in out.slots):
            errors.append(f"No classes found for {[k for k, v in DAYS.items() if v == day][0].title()}.")
    seen = [(s.weekday, s.period) for s in out.slots]
    if len(seen) != len(set(seen)):
        errors.append("A day/period appears twice.")
    out.errors = errors
    return out
