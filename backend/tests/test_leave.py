from datetime import date, timedelta

from tests.helpers import (
    API, JPG, LONG_REASON, PDF, PNG, as_staff, as_student, decide, leave_form, od_form, submit_leave, submit_od,
)

REJECT_REASON = "Exam preparation week, please apply later"


def flow_ids(client, world):
    """A student of counsellor 1 submits one leave request; returns (student headers, id)."""
    s = as_student(client, world["students"][0])
    r = submit_leave(client, s)
    assert r.status_code == 201, r.text
    return s, r.json()["id"]


def test_full_approval_flow(client, world):
    s, lid = flow_ids(client, world)
    r = client.get(f"{API}/leave/mine", headers=s).json()
    assert r[0]["status"] == "PENDING_COUNSELLOR" and r[0]["kind"] == "LEAVE"
    assert r[0]["counsellorId"] == "STAFF-1"

    c, h = as_staff(client, world["c1"]), as_staff(client, world["hod"])
    assert [q["id"] for q in client.get(f"{API}/leave/queue", headers=c).json()] == [lid]
    assert client.get(f"{API}/leave/queue", headers=h).json() == []  # not at the HOD yet

    r = decide(client, c, lid, "APPROVE")
    assert r.status_code == 200 and r.json()["status"] == "PENDING_HOD"
    assert r.json()["counsellorDecision"]["by"] == "Counsellor One"
    assert client.get(f"{API}/leave/queue", headers=c).json() == []
    assert [q["id"] for q in client.get(f"{API}/leave/queue", headers=h).json()] == [lid]

    r = decide(client, h, lid, "APPROVE")
    assert r.json()["status"] == "APPROVED" and r.json()["hodDecision"]["by"] == "HOD One"
    mine = client.get(f"{API}/leave/mine", headers=s).json()[0]
    assert mine["status"] == "APPROVED" and mine["rejectionReason"] is None


def test_counsellor_rejection_is_final_and_never_reaches_hod(client, world):
    s, lid = flow_ids(client, world)
    c, h = as_staff(client, world["c1"]), as_staff(client, world["hod"])
    r = decide(client, c, lid, "REJECT", REJECT_REASON)
    assert r.json()["status"] == "REJECTED_BY_COUNSELLOR"
    assert client.get(f"{API}/leave/queue", headers=h).json() == []
    assert decide(client, h, lid, "APPROVE").status_code == 409  # HOD cannot act on it
    assert client.get(f"{API}/leave/mine", headers=s).json()[0]["rejectionReason"] == REJECT_REASON


def test_hod_rejection(client, world):
    s, lid = flow_ids(client, world)
    c, h = as_staff(client, world["c1"]), as_staff(client, world["hod"])
    decide(client, c, lid, "APPROVE")
    r = decide(client, h, lid, "REJECT", REJECT_REASON)
    assert r.json()["status"] == "REJECTED_BY_HOD" and r.json()["hodDecision"]["remark"] == REJECT_REASON


def test_rejection_reason_is_compulsory_for_both(client, world):
    s, lid = flow_ids(client, world)
    c, h = as_staff(client, world["c1"]), as_staff(client, world["hod"])
    for body in (None, "", "too short"):
        assert decide(client, c, lid, "REJECT", body).status_code == 422
    decide(client, c, lid, "APPROVE")
    for body in (None, "short"):
        r = decide(client, h, lid, "REJECT", body)
        assert r.status_code == 422 and r.json()["code"] == "REASON_REQUIRED"


def test_decisions_are_scoped(client, world):
    s, lid = flow_ids(client, world)  # student 1 belongs to counsellor 1
    c2, hod_b, student = as_staff(client, world["c2"]), as_staff(client, world["hod_b"]), as_student(client, world["students"][1])
    assert decide(client, c2, lid, "APPROVE").status_code == 404           # another counsellor
    assert client.get(f"{API}/leave/{lid}", headers=c2).status_code == 404
    assert decide(client, student, lid, "APPROVE").status_code == 403      # a student
    assert client.get(f"{API}/leave/{lid}", headers=student).status_code == 404  # someone else's request
    c1 = as_staff(client, world["c1"])
    decide(client, c1, lid, "APPROVE")
    assert decide(client, hod_b, lid, "APPROVE").status_code in (403, 404)  # other department's HOD
    assert client.get(f"{API}/leave/queue", headers=hod_b).json() == []
    # the HOD cannot decide at the counsellor stage: the request is already past it
    assert decide(client, as_staff(client, world["hod"]), lid, "APPROVE").status_code == 200


def test_hod_cannot_skip_the_counsellor(client, world):
    s, lid = flow_ids(client, world)
    r = decide(client, as_staff(client, world["hod"]), lid, "APPROVE")
    assert r.status_code == 409 and r.json()["code"] == "WRONG_STAGE"


def test_leave_validation(client, world):
    s = as_student(client, world["students"][0])
    d = date.today() + timedelta(days=3)
    assert submit_leave(client, s, leave_form(reason="too short")).status_code == 422
    assert submit_leave(client, s, leave_form(category="Vacation")).status_code == 422
    assert submit_leave(client, s, leave_form(fromDate=(d + timedelta(days=2)).isoformat(), toDate=d.isoformat())).status_code == 422
    assert submit_leave(client, s, leave_form(kind="WRONG")).status_code == 422
    assert submit_leave(client, s, leave_form()).status_code == 201
    assert submit_leave(client, s, leave_form()).json()["code"] == "OVERLAP"  # same dates again


def test_od_needs_details_and_a_valid_letter(client, world):
    s = as_student(client, world["students"][0])
    assert submit_od(client, s, od_form(eventName="")).status_code == 422
    assert submit_od(client, s, od_form(category="Picnic")).status_code == 422
    r = submit_leave(client, s, od_form(), letter=None)
    assert r.status_code == 422 and r.json()["code"] == "LETTER_REQUIRED"
    r = submit_od(client, s, letter=("letter.exe", b"MZ\x90\x00 not allowed", "application/pdf"))
    assert r.status_code == 422 and r.json()["code"] == "BAD_FILE"  # decided by file content, not the name
    r = submit_od(client, s, letter=("big.pdf", PDF + b"0" * (2 * 1024 * 1024), "application/pdf"))
    assert r.status_code == 422
    r = submit_od(client, s, letter=("../../etc/passwd.pdf", PDF, "application/pdf"))
    assert r.status_code == 201
    assert r.json()["letter"]["name"] == "passwd.pdf"  # path stripped
    for kind, data in (("png", PNG), ("jpg", JPG)):
        d = date.today() + timedelta(days=40 + (kind == "jpg") * 5)
        assert submit_od(client, s, od_form(fromDate=d.isoformat(), toDate=d.isoformat()),
                         letter=(f"a.{kind}", data, "x/y")).status_code == 201


def test_od_letter_download_is_scoped(client, world):
    s = as_student(client, world["students"][0])
    lid = submit_od(client, s).json()["id"]
    url = f"{API}/leave/{lid}/letter"
    for who in (s, as_staff(client, world["c1"]), as_staff(client, world["hod"])):
        r = client.get(url, headers=who)
        assert r.status_code == 200 and r.content.startswith(b"%PDF")
    for who in (as_staff(client, world["c2"]), as_student(client, world["students"][1]), as_staff(client, world["hod_b"])):
        assert client.get(url, headers=who).status_code == 404
    assert client.get(url).status_code == 401


def test_no_counsellor_means_no_request(client, world):
    from app.database import SessionLocal
    from app.models import Student
    with SessionLocal() as db:
        st = db.query(Student).filter_by(register_no=world["students"][0]).one()
        st.counsellor_id = None
        db.commit()
    r = submit_leave(client, as_student(client, world["students"][0]))
    assert r.status_code == 409 and r.json()["code"] == "NO_COUNSELLOR"


def test_reassign_by_hod_only_while_pending_counsellor(client, world):
    s, lid = flow_ids(client, world)
    h, c1, c2 = as_staff(client, world["hod"]), as_staff(client, world["c1"]), as_staff(client, world["c2"])
    assert client.post(f"{API}/leave/{lid}/reassign", json={"counsellorId": "STAFF-2"}, headers=c1).status_code == 403
    assert client.post(f"{API}/leave/{lid}/reassign", json={"counsellorId": "HOD-1"}, headers=h).status_code == 422
    r = client.post(f"{API}/leave/{lid}/reassign", json={"counsellorId": "staff-2"}, headers=h)
    assert r.status_code == 200 and r.json()["counsellorId"] == "STAFF-2"
    assert client.get(f"{API}/leave/queue", headers=c1).json() == []
    assert [q["id"] for q in client.get(f"{API}/leave/queue", headers=c2).json()] == [lid]
    assert decide(client, c1, lid, "APPROVE").status_code in (403, 404)
    decide(client, c2, lid, "APPROVE")
    r = client.post(f"{API}/leave/{lid}/reassign", json={"counsellorId": "STAFF-1"}, headers=h)
    assert r.status_code == 409


def test_queue_gives_approvers_context_and_ignores_counsellor_id_in_url(client, world):
    s, lid = flow_ids(client, world)
    c2 = as_staff(client, world["c2"])
    assert client.get(f"{API}/leave/queue?counsellorId=STAFF-1", headers=c2).json() == []  # cannot peek
    item = client.get(f"{API}/leave/queue", headers=as_staff(client, world["c1"])).json()[0]
    assert item["attendancePercentage"] == 80.0 and item["belowMinAttendance"] is False
    assert item["waitingDays"] == 0


def test_history_filters(client, world):
    c, h = as_staff(client, world["c1"]), as_staff(client, world["hod"])
    s1, s2 = as_student(client, world["students"][0]), as_student(client, world["students"][1])
    a = submit_leave(client, s1).json()["id"]
    b = submit_leave(client, s2).json()["id"]
    decide(client, c, a, "APPROVE")
    decide(client, c, b, "REJECT", REJECT_REASON)
    decide(client, h, a, "APPROVE")
    hist = lambda who, f: client.get(f"{API}/leave/history?filter={f}", headers=who).json()
    assert {x["request"]["id"] for x in hist(c, "ALL")} == {a, b}
    assert [x["request"]["id"] for x in hist(c, "REJECTED")] == [b]
    assert hist(c, "REJECTED")[0]["remark"] == REJECT_REASON
    assert [x["request"]["id"] for x in hist(c, "APPROVED")] == [a]
    assert [x["request"]["id"] for x in hist(h, "ALL")] == [a]  # the HOD only decided one
    assert hist(as_staff(client, world["c2"]), "ALL") == []
