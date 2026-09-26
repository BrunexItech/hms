from datetime import date

from .conftest import csrf, login_staff, make_client, make_org, make_staff, make_unit_with_tenant

API = "/api/v1"


def owner_client(db, org, email="owner@alpha.co.ke"):
    make_staff(db, org, email)
    c = make_client()
    assert login_staff(c, email).status_code == 200
    return c


def test_rent_invoice_status_follows_payments(db):
    org = make_org(db, "alpha")
    _, unit, _ = make_unit_with_tenant(db, org)
    owner = owner_client(db, org)
    h = csrf(owner)

    inv = owner.post(f"{API}/staff/rent-invoices", headers=h, json={
        "unit_id": str(unit.id), "period_start": "2020-01-01", "period_end": "2020-01-31",
        "amount_due": 25000, "due_date": "2020-01-05",
    }).json()
    assert inv["status"] == "overdue"

    part = owner.post(f"{API}/staff/rent-invoices/{inv['id']}/payments", headers=h, json={"amount": 10000, "method": "mpesa", "paid_at": "2020-01-10"}).json()
    assert part["status"] == "partially_paid" and part["total_paid"] == 10000

    full = owner.post(f"{API}/staff/rent-invoices/{inv['id']}/payments", headers=h, json={"amount": 15000, "method": "cash", "paid_at": "2020-01-11"}).json()
    assert full["status"] == "paid" and full["total_paid"] == 25000


def test_bulk_rent_only_bills_units_with_an_active_tenant(db):
    org = make_org(db, "alpha")
    prop, _, _ = make_unit_with_tenant(db, org)
    owner = owner_client(db, org)
    h = csrf(owner)
    owner.post(f"{API}/properties/{prop.id}/units", json={"name": "EMPTY"}, headers=h)

    res = owner.post(f"{API}/staff/rent-invoices/bulk", headers=h, json={
        "property_id": str(prop.id), "period_start": "2026-09-01", "period_end": "2026-09-30",
        "amount_due": 30000, "due_date": "2026-09-05",
    })
    assert res.status_code == 200
    assert len(res.json()) == 1 and res.json()[0]["unit_name"] == "A1"


def test_a_tenant_only_sees_their_own_units_rent(db):
    org = make_org(db, "alpha")
    _, unit_1, _ = make_unit_with_tenant(db, org, "one@example.com")
    _, unit_2, _ = make_unit_with_tenant(db, org, "two@example.com")
    owner = owner_client(db, org)
    owner.post(f"{API}/staff/rent-invoices", headers=csrf(owner), json={
        "unit_id": str(unit_1.id), "period_start": "2026-09-01", "period_end": "2026-09-30", "amount_due": 1, "due_date": "2026-09-05",
    })

    from .conftest import tenant_session
    one, two = make_client(), make_client()
    tenant_session(one, unit_1, "one@example.com")
    tenant_session(two, unit_2, "two@example.com")
    assert len(one.get(f"{API}/tenant/rent-invoices").json()) == 1
    assert two.get(f"{API}/tenant/rent-invoices").json() == []


def test_utility_bill_can_be_marked_paid_and_leaves_the_outstanding_total(db):
    org = make_org(db, "alpha")
    prop, unit, _ = make_unit_with_tenant(db, org)
    owner = owner_client(db, org)
    h = csrf(owner)

    bill = owner.post(f"{API}/staff/utility-bills", headers=h, json={
        "unit_id": str(unit.id), "utility_type": "water", "period_start": "2026-09-01", "period_end": "2026-09-30", "amount": 1200,
    }).json()
    assert bill["status"] == "pending"
    assert owner.get(f"{API}/staff/dashboard/summary").json()["utilities_outstanding"] == 1200

    paid = owner.patch(f"{API}/staff/utility-bills/{bill['id']}", headers=h, json={"status": "paid"})
    assert paid.status_code == 200 and paid.json()["status"] == "paid"
    assert owner.get(f"{API}/staff/dashboard/summary").json()["utilities_outstanding"] == 0


def test_cannot_update_another_organizations_utility_bill(db):
    org_a, org_b = make_org(db, "alpha"), make_org(db, "bravo")
    _, unit_b, _ = make_unit_with_tenant(db, org_b)
    owner_b = owner_client(db, org_b, "owner@bravo.co.ke")
    bill = owner_b.post(f"{API}/staff/utility-bills", headers=csrf(owner_b), json={
        "unit_id": str(unit_b.id), "utility_type": "water", "period_start": "2026-09-01", "period_end": "2026-09-30", "amount": 5,
    }).json()

    owner_a = owner_client(db, org_a)
    assert owner_a.patch(f"{API}/staff/utility-bills/{bill['id']}", headers=csrf(owner_a), json={"status": "paid"}).status_code == 404


def test_dashboard_summary_numbers_are_correct_and_respect_module_flags(db):
    org = make_org(db, "alpha", enabled_modules=["properties", "tenants", "rent"])
    prop, unit, _ = make_unit_with_tenant(db, org)
    owner = owner_client(db, org)
    h = csrf(owner)
    owner.post(f"{API}/properties/{prop.id}/units", json={"name": "A2"}, headers=h)

    today = date.today()
    inv = owner.post(f"{API}/staff/rent-invoices", headers=h, json={
        "unit_id": str(unit.id), "period_start": today.replace(day=1).isoformat(), "period_end": today.isoformat(),
        "amount_due": 20000, "due_date": today.isoformat(),
    }).json()
    owner.post(f"{API}/staff/rent-invoices/{inv['id']}/payments", headers=h, json={"amount": 5000, "method": "cash", "paid_at": today.isoformat()})

    s = owner.get(f"{API}/staff/dashboard/summary").json()
    assert s["total_units"] == 2 and s["occupied_units"] == 1 and s["occupancy_rate"] == 50.0
    assert s["active_tenants"] == 1
    assert s["rent_due_this_month"] == 20000
    assert s["rent_collected_this_month"] == 5000
    assert s["rent_outstanding"] == 15000
    assert len(s["monthly_revenue"]) == 6 and s["monthly_revenue"][-1]["collected"] == 5000

    # Modules that are switched off are reported off and carry no numbers.
    assert s["complaints_enabled"] is False and s["open_complaints"] is None
    assert s["utilities_enabled"] is False and s["utilities_outstanding"] is None


def test_dashboard_only_counts_own_organization(db):
    org_a, org_b = make_org(db, "alpha"), make_org(db, "bravo")
    make_unit_with_tenant(db, org_b)
    owner_a = owner_client(db, org_a)
    s = owner_a.get(f"{API}/staff/dashboard/summary").json()
    assert s["total_properties"] == 0 and s["total_units"] == 0 and s["active_tenants"] == 0
