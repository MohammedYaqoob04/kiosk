import openpyxl
import pytest

from app.importers.timetable_sheet import parse

GRID = [
    ["TITLE"], ["Department", "Artificial Intelligence and Data Science"], ["Year Category", "Final Year"],
    ["Semester", "VII"], ["Hall", "C14"], ["Effective From", "2026-07-20"],
    ["DAY", "PERIOD 1", "PERIOD 2", "BREAK", "PERIOD 3", "PERIOD 4", "LUNCH", "PERIOD 5", "PERIOD 6", "PERIOD 7"],
    ["TIME", "09:20\u201310:10", "10:10\u201311:00", "11:00\u201311:20", "11:20\u201312:10", "12:10\u201313:00",
     "13:00\u201313:50", "13:50\u201314:40", "14:40\u201315:30", "15:30\u201316:20"],
]
DAY = ["AI3021 / IT in Agricultural System", None, "BREAK", "Skill Development", "Library / Counseling", "LUNCH",
       "AI3021 / IT in Agricultural System", "AI3021 / IT in Agricultural System", "AI3021 / IT in Agricultural System"]
FACULTY = [["SUBJECT / FACULTY DETAILS"], ["Code", "Subject", "Faculty"],
           ["AI3021", "IT in Agricultural System", "Mrs. V. Anitha"], ["\u2014", "Skill Development Class", "Assigned Faculty"]]


def make(tmp_path, day=DAY, grid=GRID, faculty=FACULTY):
    wb = openpyxl.Workbook()
    ws = wb.active
    for row in grid:
        ws.append(row)
    for name in ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday"):
        ws.append([name, *day])
    for row in faculty:
        ws.append(row)
    path = tmp_path / "tt.xlsx"
    wb.save(path)
    return path


def test_happy_path(tmp_path):
    t = parse(make(tmp_path))
    assert t.errors == []
    assert (t.department_code, t.semester, t.hall) == ("AIDS", 7, "C14")
    assert t.periods[1] == ("09:20", "10:10") and t.periods[7] == ("15:30", "16:20")
    assert [b[:3] for b in t.breaks] == [("Break", "11:00", "11:20"), ("Lunch", "13:00", "13:50")]
    assert len(t.slots) == 5 * 7 - 5  # one free period per day
    assert len(t.free_periods) == 5


def test_label_only_slots_have_no_subject_code(tmp_path):
    t = parse(make(tmp_path))
    skill = [s for s in t.slots if s.label == "Skill Development"]
    assert skill and all(s.subject_code is None for s in skill)
    assert t.subjects["AI3021"][1] == "Mrs. V. Anitha"
    assert t.other_faculty["Skill Development Class"] is None  # 'Assigned Faculty' is a placeholder


def test_unknown_subject_code_is_an_error(tmp_path):
    day = list(DAY)
    day[0] = "XX9999 / Mystery Subject"
    assert any("XX9999" in e for e in parse(make(tmp_path, day=day)).errors)


def test_bad_time_is_an_error(tmp_path):
    grid = [list(r) for r in GRID]
    grid[7][1] = "nine twenty"
    assert any("PERIOD 1" in e for e in parse(make(tmp_path, grid=grid)).errors)


def test_name_mismatch_is_an_error(tmp_path):
    faculty = [list(r) for r in FACULTY]
    faculty[2][1] = "A Different Name"
    assert any("Name mismatch" in e for e in parse(make(tmp_path, faculty=faculty)).errors)
