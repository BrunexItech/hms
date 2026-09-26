from datetime import datetime, timedelta, timezone

from app.models.staff_user import StaffRole, StaffUser

from .conftest import PASSWORD, csrf, login_staff, make_client, make_org, make_staff

API = "/api/v1"


def test_login_sets_httponly_session_and_csrf_cookies(client, db):
    make_staff(db, make_org(db, "acme"), "owner@acme.co.ke")
    res = login_staff(client, "owner@acme.co.ke")
    assert res.status_code == 200
    set_cookie = " ".join(res.headers.get_list("set-cookie")).lower()
    assert "staff_access=" in set_cookie and "httponly" in set_cookie
    assert client.cookies.get("csrf_token")
    assert client.get(f"{API}/auth/staff/me").json()["email"] == "owner@acme.co.ke"


def test_wrong_password_and_unknown_user_are_indistinguishable(client, db):
    make_staff(db, make_org(db, "acme"), "owner@acme.co.ke")
    wrong = login_staff(client, "owner@acme.co.ke", "nope-nope-1")
    unknown = login_staff(client, "ghost@acme.co.ke")
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


def test_account_locks_after_five_failures_then_recovers_after_lockout(client, db):
    user = make_staff(db, make_org(db, "acme"), "owner@acme.co.ke")
    for _ in range(5):
        assert login_staff(client, "owner@acme.co.ke", "wrong-pass-1").status_code == 401

    # Even the correct password is refused while locked.
    assert login_staff(client, "owner@acme.co.ke").status_code == 423

    db.expire_all()
    locked = db.get(StaffUser, user.id)
    locked.locked_until = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.commit()
    assert login_staff(client, "owner@acme.co.ke").status_code == 200


def test_logout_ends_the_session(client, db):
    make_staff(db, make_org(db, "acme"), "owner@acme.co.ke")
    login_staff(client, "owner@acme.co.ke")
    assert client.post(f"{API}/auth/staff/logout").status_code == 200
    assert client.get(f"{API}/auth/staff/me").status_code == 401


def test_change_password_requires_current_password_and_rotates_credentials(client, db):
    make_staff(db, make_org(db, "acme"), "owner@acme.co.ke")
    login_staff(client, "owner@acme.co.ke")
    h = csrf(client)

    bad = client.post(f"{API}/auth/staff/change-password", json={"current_password": "wrong-pass-1", "new_password": "BrandNew-Pass-7"}, headers=h)
    assert bad.status_code == 400
    short = client.post(f"{API}/auth/staff/change-password", json={"current_password": PASSWORD, "new_password": "short"}, headers=h)
    assert short.status_code == 422

    ok = client.post(f"{API}/auth/staff/change-password", json={"current_password": PASSWORD, "new_password": "BrandNew-Pass-7"}, headers=h)
    assert ok.status_code == 200

    fresh = make_client()
    assert login_staff(fresh, "owner@acme.co.ke", PASSWORD).status_code == 401
    assert login_staff(fresh, "owner@acme.co.ke", "BrandNew-Pass-7").status_code == 200


def test_csrf_is_required_for_mutations_but_not_reads(client, db):
    make_staff(db, make_org(db, "acme"), "owner@acme.co.ke")
    login_staff(client, "owner@acme.co.ke")

    assert client.get(f"{API}/properties").status_code == 200
    assert client.post(f"{API}/properties", json={"name": "Nope"}).status_code == 403
    assert client.post(f"{API}/properties", json={"name": "Nope"}, headers={"X-CSRF-Token": "forged"}).status_code == 403
    assert client.post(f"{API}/properties", json={"name": "Yes"}, headers=csrf(client)).status_code == 200


def test_unauthenticated_requests_are_rejected(client):
    for path in ("/properties", "/tenancies", "/staff", "/staff/dashboard/summary", "/organizations"):
        assert client.get(f"{API}{path}").status_code == 401, path


def test_only_super_admin_can_manage_organizations(client, db):
    org = make_org(db, "acme")
    make_staff(db, org, "owner@acme.co.ke")
    login_staff(client, "owner@acme.co.ke")
    body = {"name": "X", "slug": "x", "owner_email": "o@x.co.ke", "owner_password": "LongEnough-1", "owner_full_name": "O"}
    assert client.post(f"{API}/organizations", json=body, headers=csrf(client)).status_code == 403
    assert client.get(f"{API}/organizations").status_code == 403

    admin = make_client()
    make_staff(db, None, "root@platform.co.ke", StaffRole.SUPER_ADMIN)
    login_staff(admin, "root@platform.co.ke")
    assert admin.post(f"{API}/organizations", json=body, headers=csrf(admin)).status_code == 200


def test_owner_can_manage_team_but_manager_cannot(client, db):
    org = make_org(db, "acme")
    make_staff(db, org, "owner@acme.co.ke")
    login_staff(client, "owner@acme.co.ke")
    h = csrf(client)

    invite = client.post(f"{API}/staff", json={"full_name": "Mary", "email": "mary@acme.co.ke", "password": "TempPass-123"}, headers=h)
    assert invite.status_code == 200 and invite.json()["role"] == "manager"
    member_id = invite.json()["id"]

    manager = make_client()
    assert login_staff(manager, "mary@acme.co.ke", "TempPass-123").status_code == 200
    denied = manager.post(f"{API}/staff", json={"full_name": "Eve", "email": "eve@acme.co.ke", "password": "TempPass-123"}, headers=csrf(manager))
    assert denied.status_code == 403
    assert manager.post(f"{API}/staff/{member_id}/deactivate", headers=csrf(manager)).status_code == 403

    # Owner disables the manager → their live session dies immediately.
    assert client.post(f"{API}/staff/{member_id}/deactivate", headers=h).status_code == 200
    assert manager.get(f"{API}/auth/staff/me").status_code == 401

    # Owner can't disable themselves or the owner account.
    me = client.get(f"{API}/auth/staff/me").json()["id"]
    assert client.post(f"{API}/staff/{me}/deactivate", headers=h).status_code == 400


def test_owner_password_reset_replaces_credentials_and_clears_lockout(client, db):
    org = make_org(db, "acme")
    make_staff(db, org, "owner@acme.co.ke")
    mary = make_staff(db, org, "mary@acme.co.ke", StaffRole.MANAGER, "OldPass-12345")
    for _ in range(5):
        login_staff(make_client(), "mary@acme.co.ke", "wrong-pass-1")

    login_staff(client, "owner@acme.co.ke")
    res = client.post(f"{API}/staff/{mary.id}/reset-password", json={"password": "FreshPass-9876"}, headers=csrf(client))
    assert res.status_code == 200

    fresh = make_client()
    assert login_staff(fresh, "mary@acme.co.ke", "OldPass-12345").status_code == 401
    assert login_staff(fresh, "mary@acme.co.ke", "FreshPass-9876").status_code == 200
