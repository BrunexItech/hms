from datetime import date, datetime, timedelta, timezone

from app.models.access_request import TenantAccessRequest
from app.models.organization import Organization
from app.models.staff_user import StaffRole

from .conftest import csrf, login_staff, make_client, make_org, make_staff, make_unit_with_tenant, tenant_session

API = "/api/v1"


def owner_client(db, org, email):
    make_staff(db, org, email)
    c = make_client()
    assert login_staff(c, email).status_code == 200
    return c


# ── Multi-tenant isolation ────────────────────────────────────────────

def test_staff_cannot_see_or_touch_another_organizations_data(db):
    org_a, org_b = make_org(db, "alpha"), make_org(db, "bravo")
    prop_b, unit_b, tenancy_b = make_unit_with_tenant(db, org_b, "b-tenant@example.com")
    a = owner_client(db, org_a, "owner@alpha.co.ke")

    assert a.get(f"{API}/properties").json() == []
    assert a.get(f"{API}/tenancies").json() == []
    assert a.get(f"{API}/properties/{prop_b.id}/units").status_code == 404
    assert a.get(f"{API}/units/{unit_b.id}/access-link").status_code == 404
    assert a.post(f"{API}/units/{unit_b.id}/regenerate-access-link", headers=csrf(a)).status_code == 404
    assert a.post(f"{API}/properties/{prop_b.id}/units", json={"name": "Z9"}, headers=csrf(a)).status_code == 404
    assert a.post(f"{API}/tenancies/{tenancy_b.id}/disable", json={}, headers=csrf(a)).status_code == 404
    assert a.delete(f"{API}/properties/{prop_b.id}", headers=csrf(a)).status_code == 404
    forged = {"unit_id": str(unit_b.id), "full_name": "Mallory", "email": "m@example.com", "start_date": "2026-01-01"}
    assert a.post(f"{API}/tenancies", json=forged, headers=csrf(a)).status_code == 404


def test_tenant_only_sees_their_own_unit_data(db):
    org = make_org(db, "alpha")
    _, unit_1, _ = make_unit_with_tenant(db, org, "one@example.com")
    _, unit_2, _ = make_unit_with_tenant(db, org, "two@example.com")

    one, two = make_client(), make_client()
    tenant_session(one, unit_1, "one@example.com")
    tenant_session(two, unit_2, "two@example.com")

    made = one.post(f"{API}/tenant/complaints", json={"subject": "Leak", "description": "Tap", "priority": "high"}, headers=csrf(one))
    assert made.status_code == 200
    assert len(one.get(f"{API}/tenant/complaints").json()) == 1
    assert two.get(f"{API}/tenant/complaints").json() == []


# ── Passwordless tenant access ────────────────────────────────────────

def test_only_a_registered_email_gets_a_link_and_response_does_not_leak_which(db, client):
    org = make_org(db, "alpha")
    _, unit, _ = make_unit_with_tenant(db, org, "resident@example.com")

    ok = client.post(f"{API}/auth/tenant/{unit.access_slug}/request", json={"email": "resident@example.com"}).json()
    bad = client.post(f"{API}/auth/tenant/{unit.access_slug}/request", json={"email": "stranger@example.com"}).json()
    missing = client.post(f"{API}/auth/tenant/does-not-exist/request", json={"email": "resident@example.com"}).json()

    assert "dev_magic_link" in ok
    assert ok["message"] == bad["message"] == missing["message"]
    assert "dev_magic_link" not in bad and "dev_magic_link" not in missing


def test_magic_link_is_single_use_and_expires(db, client):
    org = make_org(db, "alpha")
    _, unit, _ = make_unit_with_tenant(db, org)

    first = make_client()
    res = first.post(f"{API}/auth/tenant/{unit.access_slug}/request", json={"email": "resident@example.com"}).json()
    token = res["dev_magic_link"].split("token=")[1]
    assert first.post(f"{API}/auth/tenant/verify", json={"token": token}).status_code == 200
    assert make_client().post(f"{API}/auth/tenant/verify", json={"token": token}).status_code == 400

    res2 = client.post(f"{API}/auth/tenant/{unit.access_slug}/request", json={"email": "resident@example.com"}).json()
    token2 = res2["dev_magic_link"].split("token=")[1]
    row = db.query(TenantAccessRequest).order_by(TenantAccessRequest.created_at.desc()).first()
    row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()
    assert make_client().post(f"{API}/auth/tenant/verify", json={"token": token2}).status_code == 400


def test_unit_link_alone_grants_nothing(db, client):
    org = make_org(db, "alpha")
    _, unit, _ = make_unit_with_tenant(db, org)
    assert client.get(f"{API}/public/units/{unit.access_slug}").status_code == 200
    assert client.get(f"{API}/auth/tenant/me").status_code == 401
    assert client.get(f"{API}/tenant/complaints").status_code == 401


def test_regenerating_a_unit_link_kills_the_old_one(db):
    org = make_org(db, "alpha")
    _, unit, _ = make_unit_with_tenant(db, org)
    owner = owner_client(db, org, "owner@alpha.co.ke")
    old_slug = unit.access_slug
    assert owner.post(f"{API}/units/{unit.id}/regenerate-access-link", headers=csrf(owner)).status_code == 200
    assert make_client().get(f"{API}/public/units/{old_slug}").status_code == 404


# ── Revocation on vacate ──────────────────────────────────────────────

def test_disabling_a_tenancy_revokes_a_live_session_immediately(db):
    org = make_org(db, "alpha")
    _, unit, tenancy = make_unit_with_tenant(db, org)
    owner = owner_client(db, org, "owner@alpha.co.ke")

    resident = make_client()
    assert tenant_session(resident, unit).status_code == 200
    assert resident.get(f"{API}/auth/tenant/me").status_code == 200

    assert owner.post(f"{API}/tenancies/{tenancy.id}/disable", json={"reason": "moved out"}, headers=csrf(owner)).status_code == 200

    assert resident.get(f"{API}/auth/tenant/me").status_code == 401
    assert resident.post(f"{API}/auth/tenant/refresh").status_code == 401
    again = make_client().post(f"{API}/auth/tenant/{unit.access_slug}/request", json={"email": "resident@example.com"}).json()
    assert "dev_magic_link" not in again


# ── Module gating (enforced server-side) ──────────────────────────────

def test_disabled_module_is_blocked_for_staff_and_tenants(db):
    org = make_org(db, "alpha", enabled_modules=["properties", "tenants", "visitor_booking"])
    _, unit, _ = make_unit_with_tenant(db, org)
    owner = owner_client(db, org, "owner@alpha.co.ke")
    resident = make_client()
    tenant_session(resident, unit)

    assert owner.get(f"{API}/staff/complaints").status_code == 403
    assert resident.post(f"{API}/tenant/complaints", json={"subject": "x", "description": "y", "priority": "low"}, headers=csrf(resident)).status_code == 403
    assert resident.get(f"{API}/tenant/rent-invoices").status_code == 403
    assert owner.get(f"{API}/staff/visitors").status_code == 200

    keys = {m["key"] for m in resident.get(f"{API}/modules/tenant-me").json()}
    assert keys == {"visitor_booking"}


def test_super_admin_toggle_takes_effect_immediately(db):
    org = make_org(db, "alpha")
    owner = owner_client(db, org, "owner@alpha.co.ke")
    assert owner.get(f"{API}/staff/complaints").status_code == 200

    make_staff(db, None, "root@platform.co.ke", StaffRole.SUPER_ADMIN)
    admin = make_client()
    login_staff(admin, "root@platform.co.ke")
    modules = admin.get(f"{API}/organizations/{org.id}/modules").json()
    complaints = next(m for m in modules if m["key"] == "complaints")
    res = admin.put(f"{API}/organizations/{org.id}/modules/{complaints['id']}", json={"enabled": False}, headers=csrf(admin))
    assert res.status_code == 200
    assert owner.get(f"{API}/staff/complaints").status_code == 403


# ── Organization suspension ───────────────────────────────────────────

def test_suspending_an_organization_locks_out_staff_and_residents(db):
    org = make_org(db, "alpha")
    _, unit, _ = make_unit_with_tenant(db, org)
    owner = owner_client(db, org, "owner@alpha.co.ke")
    resident = make_client()
    tenant_session(resident, unit)

    make_staff(db, None, "root@platform.co.ke", StaffRole.SUPER_ADMIN)
    admin = make_client()
    login_staff(admin, "root@platform.co.ke")
    assert admin.post(f"{API}/organizations/{org.id}/suspend", headers=csrf(admin)).status_code == 200

    assert owner.get(f"{API}/properties").status_code == 403
    assert resident.get(f"{API}/auth/tenant/me").status_code == 403
    assert login_staff(make_client(), "owner@alpha.co.ke").status_code == 403
    blocked = make_client().post(f"{API}/auth/tenant/{unit.access_slug}/request", json={"email": "resident@example.com"}).json()
    assert "dev_magic_link" not in blocked

    assert admin.post(f"{API}/organizations/{org.id}/reactivate", headers=csrf(admin)).status_code == 200
    assert owner.get(f"{API}/properties").status_code == 200
    assert login_staff(make_client(), "owner@alpha.co.ke").status_code == 200
    db.expire_all()
    assert db.get(Organization, org.id).is_active is True
