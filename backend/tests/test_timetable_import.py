from datetime import date
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Student, TimetableEntry
from scripts.import_timetable import main as import_main
from tests.helpers import API, as_student

TIMETABLE_FILE = Path(__file__).resolve().parent.parent / "private_data" / "timetable.xlsx"


def test_timetable_import_and_endpoints(client, world, monkeypatch):
    with SessionLocal() as db:
        db.query(TimetableEntry).delete()
        db.commit()

    # 1. Import twice gives the same row count (31 classes)
    monkeypatch.setattr("sys.argv", ["import_timetable.py", "--file", str(TIMETABLE_FILE)])
    assert import_main() == 0
    with SessionLocal() as db:
        count1 = db.query(TimetableEntry).count()
        assert count1 == 31

    # Second import gives the same count (31 classes, no duplicates)
    assert import_main() == 0
    with SessionLocal() as db:
        count2 = db.query(TimetableEntry).count()
        assert count2 == 31

    # Set student 0 to semester 7
    with SessionLocal() as db:
        s0 = db.scalars(select(Student).where(Student.register_no == world["students"][0])).one()
        s0.semester = 7
        db.commit()

    h7 = as_student(client, world["students"][0])
    h5 = as_student(client, world["students"][1])  # semester 5

    # 2. Monday returns 7 hours in order with period 2 free
    # 2026-07-20 is effective_from and is a Monday
    r = client.get(f"{API}/timetable?date=2026-07-20", headers=h7).json()
    assert r["date"] == "2026-07-20"
    assert r["dayName"] == "Monday"
    assert r["hall"] == "C14"
    assert len(r["breaks"]) == 2
    assert r["breaks"][0]["name"] == "Break" and r["breaks"][0]["afterPeriod"] == 2
    assert r["breaks"][1]["name"] == "Lunch" and r["breaks"][1]["afterPeriod"] == 4
    assert len(r["hours"]) == 7
    assert [h["period"] for h in r["hours"]] == [1, 2, 3, 4, 5, 6, 7]
    assert [h["hour"] for h in r["hours"]] == [1, 2, 3, 4, 5, 6, 7]

    # Period 2 is free
    p2 = r["hours"][1]
    assert p2["isFree"] is True
    assert p2["subjectCode"] is None
    assert p2["startTime"] == "10:10" and p2["endTime"] == "11:00"

    # Period 1 is label-only (Skill Development)
    p1 = r["hours"][0]
    assert p1["isFree"] is False
    assert p1["subjectCode"] is None
    assert p1["subjectName"] == "Skill Development"
    assert p1["startTime"] == "09:20" and p1["endTime"] == "10:10"

    # Period 3 has subject and faculty
    p3 = r["hours"][2]
    assert p3["isFree"] is False
    assert p3["subjectCode"] == "OBT357"
    assert p3["subjectName"] == "Biotechnology in Healthcare"
    assert p3["staffName"] == "Ms. N. Rithi Priyanka"

    # 3. Saturday empty
    r_sat = client.get(f"{API}/timetable?date=2026-07-25", headers=h7).json()
    assert r_sat["hours"] == []

    # Sunday empty
    r_sun = client.get(f"{API}/timetable?date=2026-07-26", headers=h7).json()
    assert r_sun["hours"] == []

    # Date before effective_from (2026-07-20) empty
    r_before = client.get(f"{API}/timetable?date=2026-07-13", headers=h7).json()
    assert r_before["hours"] == []

    # 4. A student of another semester sees nothing
    r_sem5 = client.get(f"{API}/timetable?date=2026-07-20", headers=h5).json()
    assert r_sem5["hours"] == []

    # 5. Assignment dropdown has the 5 subjects for semester 7
    opt = client.get(f"{API}/assignments/options", headers=h7).json()
    assert len(opt["subjects"]) == 5
    codes = {s["code"] for s in opt["subjects"]}
    assert codes == {"AI3021", "GE3791", "GE3752", "CME365", "OBT357"}
