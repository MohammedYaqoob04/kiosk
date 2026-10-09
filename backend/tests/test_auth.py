from tests.helpers import API, FRESH_DOB_PW, STAFF_PW, STUDENT_PW, as_staff, as_student, login


def post_login(client, u, p, portal=None):
    body = {"username": u, "password": p}
    if portal:
        body["portal"] = portal
    return client.post(f"{API}/auth/login", json=body)


def test_student_first_login_uses_ddmmyyyy(client, world):
    r = post_login(client, world["fresh"], FRESH_DOB_PW)  # 14 May 2006 -> 14052006
    assert r.status_code == 200
    assert r.json()["user"]["mustChangePassword"] is True
    for typed in ("14-05-2006", "14/05/2006", "14.05.2006"):  # typed with separators
        assert post_login(client, world["fresh"], typed).status_code == 200
    assert post_login(client, world["fresh"], "1405").status_code == 401  # ddmm alone no longer works
    assert post_login(client, world["fresh"], "01012000").status_code == 401


def test_wrong_password_and_unknown_user_look_identical(client, world):
    a = post_login(client, world["fresh"], "9999")
    b = post_login(client, "510400000000", "9999")
    assert a.status_code == b.status_code == 401
    assert a.json() == b.json() == {"code": "INVALID_CREDENTIALS", "message": "Invalid credentials."}


def test_errors_are_flat_code_and_message(client, world):
    r = client.get(f"{API}/profile")
    assert r.status_code == 401 and set(r.json()) == {"code", "message"}
    r = client.post(f"{API}/auth/login", json={"username": "x"})
    assert r.status_code == 422 and r.json()["code"] == "VALIDATION_ERROR" and "message" in r.json()


def test_lockout_after_five_failures(client, world):
    reg = world["students"][0]
    for _ in range(5):
        assert post_login(client, reg, "wrong").status_code == 401
    r = post_login(client, reg, STUDENT_PW)  # even the right password is refused while locked
    assert r.status_code == 429 and r.json()["code"] == "ACCOUNT_LOCKED"


def test_portal_mismatch_only_after_correct_password(client, world):
    reg = world["students"][0]
    assert post_login(client, reg, STUDENT_PW, "student").status_code == 200
    r = post_login(client, reg, STUDENT_PW, "hod")
    assert r.status_code == 403 and r.json()["code"] == "WRONG_PORTAL"
    assert post_login(client, reg, "wrong", "hod").status_code == 401  # no hint about the portal
    assert post_login(client, world["c1"], STAFF_PW, "staff").status_code == 200
    assert post_login(client, world["hod"], STAFF_PW, "hod").status_code == 200


def test_usernames_are_case_and_space_insensitive(client, world):
    assert post_login(client, " staff-1 ", STAFF_PW).status_code == 200


def test_must_change_password_blocks_everything_else(client, world):
    h = login(client, world["fresh"], FRESH_DOB_PW)
    r = client.get(f"{API}/profile", headers=h)
    assert r.status_code == 403 and r.json()["code"] == "PASSWORD_CHANGE_REQUIRED"
    assert client.get(f"{API}/auth/me", headers=h).status_code == 200  # still allowed

    for bad in ("1405", "140506", "14052006", "14-05-2006", "123456", "111111", "12345", "abc", "5104232430"):
        r = client.post(f"{API}/auth/change-password", headers=h, json={"current": FRESH_DOB_PW, "next": bad})
        assert r.status_code == 422, bad
    r = client.post(f"{API}/auth/change-password", headers=h, json={"current": "wrong", "next": "482916"})
    assert r.status_code == 401
    r = client.post(f"{API}/auth/change-password", headers=h, json={"current": "14-05-2006", "next": "482-916"})
    assert r.status_code == 200 and r.json()["changed"] is True  # a hyphen in the new password is fine
    new_h = {"Authorization": f"Bearer {r.json()['accessToken']}"}
    assert client.get(f"{API}/profile", headers=new_h).status_code == 200
    assert client.get(f"{API}/profile", headers=h).status_code == 401  # the old token died
    assert post_login(client, world["fresh"], FRESH_DOB_PW).status_code == 401
    assert post_login(client, world["fresh"], "482-916").status_code == 200


def test_staff_password_policy(client, world):
    h = as_staff(client, world["c1"])
    cur = "1234"
    r = client.post(f"{API}/auth/change-password", headers=h, json={"current": STAFF_PW, "next": cur})
    assert r.status_code == 200
    h = login(client, world["c1"], cur)

    for bad in ("abc", "abcde", "password", "123456"):
        r = client.post(f"{API}/auth/change-password", headers=h, json={"current": cur, "next": bad})
        assert r.status_code == 422, bad

    for good in ("abcd", "ABCD", "Ab12", "a@#1", "1A@b"):
        r = client.post(f"{API}/auth/change-password", headers=h, json={"current": cur, "next": good})
        assert r.status_code == 200
        cur = good
        h = login(client, world["c1"], cur)



def test_logout_kills_the_token(client, world):
    h = as_student(client, world["students"][0])
    assert client.get(f"{API}/profile", headers=h).status_code == 200
    assert client.post(f"{API}/auth/logout", headers=h).status_code == 204
    assert client.get(f"{API}/profile", headers=h).status_code == 401


def test_no_token_and_garbage_token(client, world):
    assert client.get(f"{API}/profile").status_code == 401
    assert client.get(f"{API}/profile", headers={"Authorization": "Bearer nonsense"}).status_code == 401


def test_roles_are_enforced(client, world):
    s, c = as_student(client, world["students"][0]), as_staff(client, world["c1"])
    assert client.get(f"{API}/hod/overview", headers=s).status_code == 403
    assert client.get(f"{API}/hod/overview", headers=c).status_code == 403
    assert client.get(f"{API}/staff/students", headers=s).status_code == 403
    assert client.get(f"{API}/profile", headers=c).status_code == 403


def test_responses_are_never_cached(client, world):
    r = client.get(f"{API}/auth/me", headers=as_student(client, world["students"][0]))
    assert r.headers["cache-control"] == "no-store"
