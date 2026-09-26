from app.db.session import SessionLocal
from app.models.module import Module, OrganizationModule
from app.models.organization import Organization

DEFAULT_MODULES = [
    dict(key="properties", name="Properties & Units", description="Manage branches, plots and units", icon="building-2"),
    dict(key="tenants", name="Tenants", description="Register and manage resident access", icon="users"),
    dict(key="rent", name="Rent & Payments", description="Invoice rent and record payments per unit", icon="wallet"),
    dict(key="complaints", name="Complaints", description="Residents can raise and track maintenance issues", icon="message-square-warning"),
    dict(key="visitor_booking", name="Visitor Booking", description="Residents can pre-register expected visitors", icon="scan-line"),
    dict(key="utilities", name="Utilities & Billing", description="Water, electricity and other utility bills", icon="receipt"),
]


def seed_modules() -> None:
    db = SessionLocal()
    try:
        existing_keys = {m.key for m in db.query(Module).all()}
        new_modules = [Module(**data) for data in DEFAULT_MODULES if data["key"] not in existing_keys]
        db.add_all(new_modules)
        db.commit()

        # Backfill: any module introduced after an organization already
        # existed should default to enabled for it too, same as a brand-new
        # organization gets everything on — super-admin can switch it off.
        if new_modules:
            org_ids = [row[0] for row in db.query(Organization.id).all()]
            for module in new_modules:
                for org_id in org_ids:
                    db.add(OrganizationModule(organization_id=org_id, module_id=module.id, enabled=True))
            db.commit()
    finally:
        db.close()
