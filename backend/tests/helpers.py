"""Shared test constants and small helpers."""
from datetime import date, timedelta
from io import BytesIO

API = "/api/v1"
STAFF_PW = "Staff1234"
STUDENT_PW = "135790"           # a student who already chose a new password
FRESH_DOB_PW = "14052006"       # first-login password (date of birth, ddmmyyyy)
PDF = b"%PDF-1.4\n%fake pdf for tests\n"
PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 64
JPG = b"\xff\xd8\xff\xe0" + b"0" * 64
LONG_REASON = "Attending a family function out of town"


def login(client, username, password, portal=None):
    body = {"username": username, "password": password}
    if portal:
        body["portal"] = portal
    r = client.post(f"{API}/auth/login", json=body)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['accessToken']}"}


def as_student(client, reg, pw=STUDENT_PW):
    return login(client, reg, pw)


def as_staff(client, username):
    return login(client, username, STAFF_PW)


def leave_form(**over):
    d = date.today() + timedelta(days=3)
    form = {"kind": "LEAVE", "category": "Family Function", "fromDate": d.isoformat(),
            "toDate": (d + timedelta(days=1)).isoformat(), "reason": LONG_REASON}
    form.update(over)
    return form


def od_form(**over):
    d = date.today() + timedelta(days=10)
    form = {"kind": "OD", "category": "Hackathon", "fromDate": d.isoformat(), "toDate": d.isoformat(),
            "eventName": "Smart India Hackathon", "organizer": "Ministry", "venue": "Chennai"}
    form.update(over)
    return form


def submit_leave(client, headers, form=None, letter=None):
    files = {"letter": (letter[0], BytesIO(letter[1]), letter[2])} if letter else None
    return client.post(f"{API}/leave", data=form or leave_form(), files=files, headers=headers)


def submit_od(client, headers, form=None, letter=("letter.pdf", PDF, "application/pdf")):
    return submit_leave(client, headers, form or od_form(), letter)


def decide(client, headers, leave_id, decision, remark=None):
    body = {"decision": decision}
    if remark is not None:
        body["remark"] = remark
    return client.post(f"{API}/leave/{leave_id}/decision", json=body, headers=headers)
