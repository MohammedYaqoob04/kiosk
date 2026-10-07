from datetime import date, timedelta

from tests.helpers import API, as_student


def test_profile(client, world):
    p = client.get(f"{API}/profile", headers=as_student(client, world["students"][0])).json()
    assert p["registerNo"] == world["students"][0] and p["departmentCode"] == "AIDS"
    assert p["batch"] == "2023-2027" and p["semester"] == 5 and p["year"] == 3 and p["section"] == "A"
    assert p["dateOfBirth"] == "2006-05-14"
    assert not ({"aadhar", "religion", "community", "bloodGroup", "fatherName"} & set(p))


def test_students_only_ever_see_their_own_data(client, world):
    # Nothing in these URLs identifies a student: the login token does. There is no way to ask for another.
    a = client.get(f"{API}/dashboard", headers=as_student(client, world["students"][0])).json()
    b = client.get(f"{API}/dashboard", headers=as_student(client, world["students"][1])).json()
    assert a["attendance"]["overallPercent"] == 80.0 and b["attendance"]["overallPercent"] == 50.0
    assert a["marks"] and b["marks"] == []


def test_dashboard(client, world):
    d = client.get(f"{API}/dashboard", headers=as_student(client, world["students"][0])).json()
    assert d["attendance"] == {"overallPercent": 80.0, "eligible": True, "thresholdPercent": 75.0}
    b = client.get(f"{API}/dashboard", headers=as_student(client, world["students"][1])).json()
    assert b["attendance"]["eligible"] is False  # 50% is below the 75% minimum
    assert d["today"]["date"] == date.today().isoformat()
    assert [h["hour"] for h in d["today"]["hours"]] == [1, 2, 3, 4, 5, 6, 7]
    assert d["marks"][0] == {"code": "S1", "name": "Subject One", "cia1": 45.0, "asmt1": 20.0,
                             "cia2": None, "asmt2": None, "model": None}
    none = client.get(f"{API}/dashboard", headers=as_student(client, world["students"][2])).json()
    assert none["attendance"]["overallPercent"] is None and none["attendance"]["eligible"] is False


def test_timetable(client, world):
    h = as_student(client, world["students"][0])
    t = client.get(f"{API}/timetable", headers=h).json()
    assert t["date"] == date.today().isoformat() and t["hours"][0]["subjectName"] == "Subject One"
    assert t["student"]["section"] == "A"
    tomorrow = date.today() + timedelta(days=1)
    t = client.get(f"{API}/timetable?date={tomorrow.isoformat()}", headers=h).json()
    assert t["hours"] == [] and t["dayName"] == tomorrow.strftime("%A")
    assert client.get(f"{API}/timetable?date=not-a-date", headers=h).status_code == 422
    other = client.get(f"{API}/timetable", headers=as_student(client, world["students"][4])).json()
    assert other["hours"] == []  # section B has no slots


def test_fees_are_view_only_and_add_up(client, world):
    f = client.get(f"{API}/fees", headers=as_student(client, world["students"][0])).json()
    assert f["items"] == [{"feeType": "Tuition Fee", "total": 25000.0, "paid": 12500.0, "balance": 12500.0}]
    assert f["totals"] == {"total": 25000.0, "paid": 12500.0, "balance": 12500.0}
    assert f["payments"][0]["transactionId"] == "TXN1" and f["payments"][0]["receiptNo"] == "R1"
    assert "accounts office" in f["note"]
    assert client.post(f"{API}/fees/pay", headers=as_student(client, world["students"][0])).status_code == 404


def test_results_appear_only_after_release(client, world):
    h = as_student(client, world["students"][0])
    assert client.get(f"{API}/results", headers=h).json() == {"published": False, "semesters": []}
    from app.database import SessionLocal
    from app.models import Department, ResultRelease
    with SessionLocal() as db:
        dept = db.query(Department).filter_by(code="AIDS").one()
        db.add(ResultRelease(department_id=dept.id, semester=4))
        db.commit()
    r = client.get(f"{API}/results", headers=h).json()
    assert r["published"] is True and r["semesters"][0]["semester"] == 4
    assert r["semesters"][0]["subjects"][0] == {"code": "X1", "name": "Old Subject", "grade": "A", "result": "PASS"}
    assert client.get(f"{API}/results", headers=as_student(client, world["students"][1])).json()["published"] is False


def test_assignment_front_page(client, world):
    h = as_student(client, world["students"][0])
    o = client.get(f"{API}/assignments/options", headers=h).json()
    assert o["subjects"] == [{"code": "S1", "name": "Subject One"}] and o["assignmentNumbers"] == [1, 2, 3, 4, 5]
    r = client.post(f"{API}/assignments/front-page", json={"subjectCode": "S1", "no": 2}, headers=h)
    assert r.status_code == 200 and r.headers["content-type"] == "application/pdf" and r.content.startswith(b"%PDF")
    assert client.post(f"{API}/assignments/front-page", json={"subjectCode": "S2", "no": 1}, headers=h).status_code == 404
    assert client.post(f"{API}/assignments/front-page", json={"subjectCode": "S1", "no": 99}, headers=h).status_code == 422
