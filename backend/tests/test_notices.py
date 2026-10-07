from io import BytesIO

from tests.helpers import API, JPG, PDF, PNG, as_staff, as_student


def send(client, headers, files=None, **over):
    data = {"title": "Tech fest", "body": "Registrations open on Monday.", "category": "Event", "audience": "MY_STUDENTS"}
    data.update(over)
    up = [("files", (n, BytesIO(b), t)) for n, b, t in (files or [])]
    return client.post(f"{API}/notices", data=data, files=up or None, headers=headers)


def inbox(client, headers, **params):
    return client.get(f"{API}/notices/inbox", params=params, headers=headers).json()


def test_counsellor_notice_reaches_only_own_students(client, world):
    c1 = as_staff(client, world["c1"])
    r = send(client, c1)
    assert r.status_code == 201 and r.json()["recipientCount"] == 4  # 3 students + the first-login one
    assert len(inbox(client, as_student(client, world["students"][0]))) == 1
    assert inbox(client, as_student(client, world["students"][4])) == []  # another counsellor's student


def test_counsellor_cannot_address_others(client, world):
    c1 = as_staff(client, world["c1"])
    assert send(client, c1, audience="ALL_STUDENTS").status_code == 403
    assert send(client, c1, audience="SECTION:B").status_code == 403
    assert send(client, c1, audience="ALL_COUNSELLORS").status_code == 403
    assert send(client, c1, audience=f"SELECTED_STUDENTS:{world['students'][4]}").status_code == 403
    assert send(client, c1, audience=f"SELECTED_STUDENTS:{world['students'][0]},{world['students'][4]}").status_code == 403
    assert send(client, c1, audience=f"SELECTED_STUDENTS:{world['students'][0]}").json()["recipientCount"] == 1
    assert send(client, as_student(client, world["students"][0])).status_code == 403
    assert send(client, c1, pinned="true").status_code == 403  # only the HOD pins


def test_hod_audiences(client, world):
    h = as_staff(client, world["hod"])
    assert send(client, h, audience="ALL_STUDENTS").json()["recipientCount"] == 7  # not the CSE student
    assert send(client, h, audience="SECTION:B").json()["recipientCount"] == 3
    assert send(client, h, audience="ALL_COUNSELLORS").json()["recipientCount"] == 2
    assert send(client, h, audience=f"SELECTED_STUDENTS:{world['other']}").status_code == 403  # other department
    assert send(client, h, audience="MY_STUDENTS").status_code == 403
    assert send(client, h, audience="SECTION:").status_code == 422
    assert send(client, h, audience="EVERYONE").status_code == 422
    assert len(inbox(client, as_staff(client, world["c1"]))) == 1  # counsellors get "From HOD" notices
    assert inbox(client, as_student(client, world["other"])) == []


def test_validation(client, world):
    c1 = as_staff(client, world["c1"])
    assert send(client, c1, title="").status_code == 422
    assert send(client, c1, title="x" * 81).status_code == 422
    assert send(client, c1, body="y" * 1501).status_code == 422
    assert send(client, c1, category="Gossip").status_code == 422
    assert send(client, c1, expiresAt="2001-01-01").status_code == 422
    assert send(client, c1, audience=f"SELECTED_STUDENTS:{world['students'][0]}").status_code == 201


def test_attachments_are_checked_by_content(client, world):
    c1 = as_staff(client, world["c1"])
    ok = [("a.pdf", PDF, "application/pdf"), ("b.png", PNG, "image/png"), ("c.jpg", JPG, "image/jpeg")]
    r = send(client, c1, files=ok)
    assert r.status_code == 201
    note = inbox(client, as_student(client, world["students"][0]))[0]
    assert [(a["name"], a["type"]) for a in note["attachments"]] == [
        ("a.pdf", "application/pdf"), ("b.png", "image/png"), ("c.jpg", "image/jpeg")]
    assert send(client, c1, files=ok + [("d.pdf", PDF, "application/pdf")]).status_code == 422  # max 3
    assert send(client, c1, files=[("evil.pdf", b"MZ\x90\x00 an exe", "application/pdf")]).status_code == 422
    assert send(client, c1, files=[("page.pdf", b"<html>x</html>", "application/pdf")]).status_code == 422
    assert send(client, c1, files=[("big.pdf", PDF + b"0" * (2 * 1024 * 1024), "application/pdf")]).status_code == 422
    # nothing half-saved: a rejected notice leaves no notice behind
    assert len(client.get(f"{API}/notices/sent", headers=c1).json()) == 1


def test_attachment_download_authorisation(client, world):
    c1 = as_staff(client, world["c1"])
    send(client, c1, files=[("a.pdf", PDF, "application/pdf")])
    s1 = as_student(client, world["students"][0])
    att = inbox(client, s1)[0]["attachments"][0]
    nid = inbox(client, s1)[0]["id"]
    url = f"{API}/notices/{nid}/attachments/{att['id']}"
    for who in (s1, c1, as_staff(client, world["hod"])):
        r = client.get(url, headers=who)
        assert r.status_code == 200 and r.content.startswith(b"%PDF")
    assert r.headers["content-disposition"].startswith("inline")
    for who in (as_student(client, world["students"][4]), as_staff(client, world["c2"]),
                as_staff(client, world["hod_b"])):
        assert client.get(url, headers=who).status_code == 404
    assert client.get(url).status_code == 401
    client.post(f"{API}/notices/{nid}/withdraw", headers=c1)
    assert client.get(url, headers=s1).status_code == 404  # withdrawn: gone for recipients
    assert client.get(url, headers=c1).status_code == 200  # still there for the author


def test_read_tracking_and_unread_badge(client, world):
    c1 = as_staff(client, world["c1"])
    nid = send(client, c1).json()["id"]
    s1, s2 = as_student(client, world["students"][0]), as_student(client, world["students"][1])
    assert client.get(f"{API}/notices/unread-count", headers=s1).json() == {"unread": 1}
    assert inbox(client, s1)[0]["unread"] is True
    assert client.post(f"{API}/notices/{nid}/read", headers=s1).status_code == 204
    assert client.get(f"{API}/notices/unread-count", headers=s1).json() == {"unread": 0}
    assert inbox(client, s1)[0]["unread"] is False and inbox(client, s2)[0]["unread"] is True
    sent = client.get(f"{API}/notices/sent", headers=c1).json()[0]
    assert (sent["readCount"], sent["recipientCount"]) == (1, 4)
    assert client.post(f"{API}/notices/{nid}/read", headers=as_student(client, world["students"][4])).status_code == 404


def test_withdraw_and_expiry_and_pin_order(client, world):
    c1, h = as_staff(client, world["c1"]), as_staff(client, world["hod"])
    a = send(client, c1, title="First").json()["id"]
    b = send(client, c1, title="Second").json()["id"]
    s1 = as_student(client, world["students"][0])
    assert [n["title"] for n in inbox(client, s1)] == ["Second", "First"]  # newest first
    assert client.post(f"{API}/notices/{a}/pin", json={"pinned": True}, headers=h).status_code == 404  # not the HOD's own
    hod_note = send(client, h, audience="ALL_STUDENTS", title="Pinned", pinned="true").json()["id"]
    assert inbox(client, s1)[0]["title"] == "Pinned" and inbox(client, s1)[0]["pinned"] is True  # pinned first
    client.post(f"{API}/notices/{hod_note}/pin", json={"pinned": False}, headers=h)
    assert inbox(client, s1)[0]["pinned"] is False
    assert client.post(f"{API}/notices/{b}/withdraw", headers=as_staff(client, world["c2"])).status_code == 404
    assert client.post(f"{API}/notices/{b}/withdraw", headers=c1).status_code == 200
    assert "Second" not in [n["title"] for n in inbox(client, s1)]
    assert client.get(f"{API}/notices/sent", headers=c1).json()[0]["withdrawn"] is True
    assert [n["title"] for n in inbox(client, s1, category="Event")]  # category filter works
    assert inbox(client, s1, category="Exam") == []
