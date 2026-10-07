"""The real-system path: staff file + Excel upload by the HOD + first logins."""
import json
from io import BytesIO

from app.database import SessionLocal
from app.models import Student, StoredFile
from scripts import bootstrap_real
from tests.helpers import API, PDF, as_staff, login, submit_od
from tests.test_import import FIXED

STAFF = [
    {"username": "anitha-staff", "name": "Anitha", "password": "ani123", "role": "COUNSELLOR", "department": "AIDS"},
    {"username": "noorulhassan-hod", "name": "Noorul Hassan", "password": "noor123", "role": "HOD", "department": "AIDS"},
]


def run_bootstrap(tmp_path, monkeypatch, *extra):
    f = tmp_path / "staff.json"
    f.write_text(json.dumps(STAFF))
    monkeypatch.setattr("sys.argv", ["bootstrap_real", "--students", str(FIXED), "--staff", str(f), *extra])
    return bootstrap_real.main()


def post_login(client, u, p, portal=None):
    body = {"username": u, "password": p, **({"portal": portal} if portal else {})}
    return client.post(f"{API}/auth/login", json=body)


def test_bootstrap_creates_staff_and_students_and_everyone_must_change_password(client, tmp_path, monkeypatch):
    assert run_bootstrap(tmp_path, monkeypatch, "--dry-run") == 0
    with SessionLocal() as db:
        assert db.query(Student).count() == 0  # dry run wrote nothing
    assert run_bootstrap(tmp_path, monkeypatch) == 0
    assert run_bootstrap(tmp_path, monkeypatch) == 0  # safe to repeat

    # staff log in with the usernames from the staff file (case does not matter) and must change the password
    for username, portal, weak in (("anitha-staff", "staff", "ani123"), ("NoorulHassan-HOD", "hod", "noor123")):
        r = post_login(client, username, weak, portal)
        assert r.status_code == 200 and r.json()["user"]["mustChangePassword"] is True
        h = {"Authorization": f"Bearer {r.json()['accessToken']}"}
        assert client.get(f"{API}/staff/students", headers=h).status_code == 403  # blocked until changed
        bad = client.post(f"{API}/auth/change-password", headers=h, json={"current": weak, "next": "short1"})
        assert bad.status_code == 422
        ok = client.post(f"{API}/auth/change-password", headers=h, json={"current": weak, "next": f"{username}-2026"})
        assert ok.status_code == 200
        assert post_login(client, username, weak).status_code == 401
        assert post_login(client, username, f"{username}-2026", portal).status_code == 200

    # students: register number + date of birth (ddmmyyyy); all 10 belong to the only counsellor
    assert post_login(client, "510423243001", "14-05-2006", "student").status_code == 200
    h = as_staff_pw(client, "anitha-staff", "anitha-staff-2026")
    assert len(client.get(f"{API}/staff/students", headers=h).json()) == 10


def as_staff_pw(client, username, pw):
    return login(client, username, pw)


def test_hod_uploads_the_excel_sheet(client, tmp_path, monkeypatch):
    run_bootstrap(tmp_path, monkeypatch)
    r = post_login(client, "noorulhassan-hod", "noor123")
    h = {"Authorization": f"Bearer {r.json()['accessToken']}"}
    client.post(f"{API}/auth/change-password", headers=h, json={"current": "noor123", "next": "Hod-Pass-2026"})
    h = login(client, "noorulhassan-hod", "Hod-Pass-2026")
    sheet = FIXED.read_bytes()

    r = client.post(f"{API}/hod/students/import", data={"dryRun": "true"}, files={"file": ("s.xlsx", BytesIO(sheet), "x")}, headers=h)
    assert r.status_code == 200 and r.json()["ok"] and r.json()["dryRun"] and r.json()["rowsRead"] == 10
    assert "Aadhar Card Number" in r.json()["ignoredSensitiveColumns"]
    r = client.post(f"{API}/hod/students/import", data={"dryRun": "false", "assignTo": "anitha-staff"},
                    files={"file": ("s.xlsx", BytesIO(sheet), "x")}, headers=h)
    assert r.status_code == 200 and r.json()["updated"] == 10 and r.json()["created"] == 0

    assert client.post(f"{API}/hod/students/import", files={"file": ("s.xlsx", BytesIO(b"not excel"), "x")}, headers=h).status_code == 422
    assert client.post(f"{API}/hod/students/import", files={"file": ("s.xlsx", BytesIO(sheet), "x")}).status_code == 401


def test_sheet_with_duplicate_numbers_is_reported_to_the_hod(client, world):
    from tests.test_import import ORIGINAL
    h = as_staff(client, world["hod"])
    r = client.post(f"{API}/hod/students/import", data={"dryRun": "false"},
                    files={"file": ("s.xlsx", BytesIO(ORIGINAL.read_bytes()), "x")}, headers=h)
    assert r.status_code == 200 and r.json()["ok"] is False and len(r.json()["errors"]) == 10
    assert "appears in rows" in r.json()["errors"][0]["message"]


def test_other_roles_cannot_upload_a_sheet(client, world):
    from tests.test_import import FIXED as F
    for who in (as_staff(client, world["c1"]), login(client, world["students"][0], "135790")):
        r = client.post(f"{API}/hod/students/import", files={"file": ("s.xlsx", BytesIO(F.read_bytes()), "x")}, headers=who)
        assert r.status_code == 403


def test_hod_cannot_import_students_of_another_department(client, world):
    h = as_staff(client, world["hod_b"])  # CSE HOD uploads an AI&DS sheet
    from tests.test_import import FIXED as F
    r = client.post(f"{API}/hod/students/import", data={"dryRun": "false"}, files={"file": ("s.xlsx", BytesIO(F.read_bytes()), "x")}, headers=h)
    assert r.json()["ok"] is False and "not your department" in r.json()["errors"][0]["message"]


def test_uploads_live_in_the_database(client, world):
    s = login(client, world["students"][0], "135790")
    lid = submit_od(client, s).json()["id"]
    with SessionLocal() as db:
        assert db.query(StoredFile).count() == 1
        f = db.query(StoredFile).one()
        assert f.size_bytes == len(PDF) and f.data == PDF
    r = client.get(f"{API}/leave/{lid}/letter", headers=s)
    assert r.content == PDF and r.headers["content-disposition"].startswith("inline")
