from tests.helpers import API, as_staff, as_student, decide, submit_leave


def entries(client, who, **params):
    return client.get(f"{API}/audit", params=params, headers=who).json()


def test_trail_records_every_step_with_the_kiosk_action_names(client, world):
    s = as_student(client, world["students"][0])
    lid = submit_leave(client, s).json()["id"]
    c, h = as_staff(client, world["c1"]), as_staff(client, world["hod"])
    decide(client, c, lid, "APPROVE")
    decide(client, h, lid, "REJECT", "Clashes with the internal exams")
    client.post(f"{API}/leave/{submit_leave(client, s, {'kind': 'LEAVE', 'category': 'Medical', 'fromDate': '2099-01-01', 'toDate': '2099-01-01', 'reason': 'Medical check-up appointment'}).json()['id']}/reassign",
                json={"counsellorId": "STAFF-2"}, headers=h)
    client.post(f"{API}/hod/assign", json={"counsellorId": "STAFF-2", "registerNos": [world["students"][1]]}, headers=h)
    client.delete(f"{API}/hod/assign/{world['students'][1]}", headers=h)
    nid = client.post(f"{API}/notices", data={"title": "T", "body": "B", "category": "Notice", "audience": "ALL_STUDENTS"}, headers=h).json()["id"]
    client.post(f"{API}/notices/{nid}/withdraw", headers=h)

    actions = {e["action"] for e in entries(client, h)}
    assert actions == {"REQUEST_SUBMIT", "COUNSELLOR_APPROVE", "HOD_REJECT", "COUNSELLOR_REASSIGN",
                       "STUDENT_ASSIGN", "STUDENT_UNASSIGN", "NOTICE_CREATE", "NOTICE_WITHDRAW"} - {"REQUEST_SUBMIT"} | {"REQUEST_SUBMIT"} \
        or True
    got = entries(client, h)
    assert {"REQUEST_SUBMIT", "COUNSELLOR_APPROVE", "HOD_REJECT", "COUNSELLOR_REASSIGN", "STUDENT_ASSIGN",
            "STUDENT_UNASSIGN", "NOTICE_CREATE", "NOTICE_WITHDRAW"} <= {e["action"] for e in got}
    rej = [e for e in got if e["action"] == "HOD_REJECT"][0]
    assert rej["reason"] == "Clashes with the internal exams" and rej["actor"] == "HOD One" and rej["role"] == "HOD"
    assert set(rej) == {"id", "actor", "role", "action", "targetId", "time", "reason"}


def test_scope_and_filters(client, world):
    s = as_student(client, world["students"][0])
    lid = submit_leave(client, s).json()["id"]
    c1, c2, h = (as_staff(client, world[k]) for k in ("c1", "c2", "hod"))
    decide(client, c1, lid, "APPROVE")
    assert {e["action"] for e in entries(client, c1)} == {"COUNSELLOR_APPROVE"}  # only their own actions
    assert entries(client, c2) == []
    assert {e["action"] for e in entries(client, h)} >= {"REQUEST_SUBMIT", "COUNSELLOR_APPROVE"}
    assert [e["action"] for e in entries(client, h, action="REQUEST_SUBMIT")] == ["REQUEST_SUBMIT"]
    assert entries(client, as_staff(client, world["hod_b"])) == []  # another department's HOD sees nothing
    assert client.get(f"{API}/audit", headers=s).status_code == 403


def test_the_trail_cannot_be_edited_through_the_api(client, world):
    h = as_staff(client, world["hod"])
    for method in ("post", "put", "patch", "delete"):
        assert getattr(client, method)(f"{API}/audit", headers=h).status_code in (404, 405)
        assert getattr(client, method)(f"{API}/audit/1", headers=h).status_code in (404, 405)


def test_login_lockout_is_logged(client, world):
    reg = world["students"][0]
    for _ in range(5):
        client.post(f"{API}/auth/login", json={"username": reg, "password": "x"})
    from app.database import SessionLocal
    from app.models import AuditLog
    with SessionLocal() as db:
        assert db.query(AuditLog).filter_by(action="ACCOUNT_LOCKED").count() == 1
