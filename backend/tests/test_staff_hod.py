import csv
import io

from tests.helpers import API, as_staff, as_student, decide, submit_leave


def test_counsellor_sees_exactly_their_own_students(client, world):
    c1, c2 = as_staff(client, world["c1"]), as_staff(client, world["c2"])
    rows1 = client.get(f"{API}/staff/students", headers=c1).json()
    assert {r["registerNo"] for r in rows1} == set(world["students"][:3]) | {world["fresh"]}
    rows2 = client.get(f"{API}/staff/students", headers=c2).json()
    assert {r["registerNo"] for r in rows2} == set(world["students"][3:])
    # ignored: a counsellorId in the URL cannot widen the list
    assert client.get(f"{API}/staff/students?counsellorId=STAFF-2", headers=c1).json() == rows1


def test_my_students_sort_filter_search_and_privacy(client, world):
    c1 = as_staff(client, world["c1"])
    rows = client.get(f"{API}/staff/students", headers=c1).json()
    pcts = [r["attendancePercentage"] for r in rows]
    assert pcts[:2] == [50.0, 80.0] and pcts[2:] == [None, None]  # lowest first, no-data last
    below = client.get(f"{API}/staff/students?below_min=true", headers=c1).json()
    assert [r["registerNo"] for r in below] == [world["students"][1]] and below[0]["belowMinAttendance"] is True
    found = client.get(f"{API}/staff/students?q=student 01", headers=c1).json()
    assert [r["registerNo"] for r in found] == [world["students"][0]]
    assert client.get(f"{API}/staff/students?q=%25", headers=c1).json() == []  # '%' is not a wildcard
    assert rows[0]["mobile"] == "" and rows[0]["email"] == ""  # contact details hidden by default
    assert set(rows[0]) >= {"name", "registerNo", "departmentCode", "section", "semester", "assignedCounsellorId"}


def test_student_summary_scope(client, world):
    c1, c2 = as_staff(client, world["c1"]), as_staff(client, world["c2"])
    r = client.get(f"{API}/staff/students/{world['students'][0]}", headers=c1)
    assert r.status_code == 200
    assert not ({"mobile", "email", "dateOfBirth", "dob"} & set(r.json()))
    for reg in (world["students"][0], world["other"], "510499999999"):  # not theirs / other dept / nonexistent
        r = client.get(f"{API}/staff/students/{reg}", headers=c2)
        assert r.status_code == 404 and r.json()["message"] == "This student is not assigned to you."


def test_hod_overview(client, world):
    s = as_student(client, world["students"][0])
    lid = submit_leave(client, s).json()["id"]
    decide(client, as_staff(client, world["c1"]), lid, "APPROVE")
    o = client.get(f"{API}/hod/overview", headers=as_staff(client, world["hod"])).json()
    assert o["cards"]["totalStudents"] == 7  # department students only (CSE student excluded)
    assert o["cards"]["pendingApprovals"] == 1 and o["cards"]["leaveThisMonth"] == 1
    assert o["cards"]["belowMinAttendance"] == 1
    assert o["belowMinStudents"][0]["registerNo"] == world["students"][1]
    assert {x["section"] for x in o["attendanceBySection"]} == {"A", "B"}
    assert o["pendingApprovals"][0]["id"] == lid
    other = client.get(f"{API}/hod/overview", headers=as_staff(client, world["hod_b"])).json()
    assert other["cards"]["totalStudents"] == 1 and other["cards"]["pendingApprovals"] == 0


def test_hod_assigns_students_and_sections(client, world):
    h = as_staff(client, world["hod"])
    regs = world["students"][:2]
    r = client.post(f"{API}/hod/assign", json={"counsellorId": "STAFF-2", "registerNos": regs + [world["other"]]}, headers=h)
    assert r.json() == {"updated": 2, "skipped": [world["other"]]}  # other department's student is skipped
    c2 = as_staff(client, world["c2"])
    assert set(regs) <= {x["registerNo"] for x in client.get(f"{API}/staff/students", headers=c2).json()}
    r = client.post(f"{API}/hod/assign-section", json={"counsellorId": "STAFF-1", "section": "b"}, headers=h)
    assert r.json() == {"updated": 3}
    assert client.delete(f"{API}/hod/assign/{world['students'][5]}", headers=h).status_code == 200
    assert client.delete(f"{API}/hod/assign/{world['other']}", headers=h).status_code == 404
    bad = client.post(f"{API}/hod/assign", json={"counsellorId": "HOD-1", "registerNos": regs}, headers=h)
    assert bad.status_code == 422
    assert client.post(f"{API}/hod/assign", json={"counsellorId": "STAFF-2", "registerNos": regs},
                       headers=as_staff(client, world["c1"])).status_code == 403
    mine = client.get(f"{API}/hod/students", headers=h).json()
    unassigned = [x for x in mine if x["registerNo"] == world["students"][5]][0]
    assert unassigned["counsellor"] is None


def test_new_assignment_does_not_move_requests_already_submitted(client, world):
    lid = submit_leave(client, as_student(client, world["students"][0])).json()["id"]
    h = as_staff(client, world["hod"])
    client.post(f"{API}/hod/assign", json={"counsellorId": "STAFF-2", "registerNos": [world["students"][0]]}, headers=h)
    assert [q["id"] for q in client.get(f"{API}/leave/queue", headers=as_staff(client, world["c1"])).json()] == [lid]
    new = submit_leave(client, as_student(client, world["students"][0]),
                       {"kind": "LEAVE", "category": "Medical", "fromDate": "2099-01-01", "toDate": "2099-01-01",
                        "reason": "Medical check-up appointment"}).json()
    assert new["counsellorId"] == "STAFF-2"


def test_counsellors_list(client, world):
    rows = client.get(f"{API}/hod/counsellors", headers=as_staff(client, world["hod"])).json()
    assert {r["id"] for r in rows} == {"STAFF-1", "STAFF-2"}
    assert all({"id", "staffId", "name", "department", "departmentCode"} <= set(r) for r in rows)


def test_csv_reports_and_formula_injection(client, world):
    from app.database import SessionLocal
    from app.models import User
    with SessionLocal() as db:  # a malicious name that would run as a formula in Excel
        db.query(User).filter_by(username=world["students"][1]).one().full_name = '=HYPERLINK("http://evil")'
        db.commit()
    lid = submit_leave(client, as_student(client, world["students"][0])).json()["id"]
    decide(client, as_staff(client, world["c1"]), lid, "REJECT", "Not enough supporting detail given")
    h = as_staff(client, world["hod"])
    r = client.get(f"{API}/hod/reports/leave.csv", headers=h)
    assert r.headers["content-type"].startswith("text/csv") and "attachment" in r.headers["content-disposition"]
    rows = list(csv.reader(io.StringIO(r.text)))
    assert rows[0][0] == "Request ID" and rows[1][1] == world["students"][0] and rows[1][9] == "REJECTED_BY_COUNSELLOR"
    assert client.get(f"{API}/hod/reports/leave.csv?status=APPROVED", headers=h).text.count("\n") == 1  # header only
    short = list(csv.reader(io.StringIO(client.get(f"{API}/hod/reports/attendance-shortage.csv", headers=h).text)))
    assert short[1][0] == world["students"][1]
    assert short[1][1].startswith("'=")  # neutralised
    assert client.get(f"{API}/hod/reports/leave.csv", headers=as_staff(client, world["c1"])).status_code == 403
