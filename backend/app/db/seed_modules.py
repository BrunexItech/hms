from app.db.session import SessionLocal
from app.models.module import Module

DEFAULT_MODULES = [
    dict(key="properties", name="Properties & Units", description="Manage branches, plots and units", icon="building-2"),
    dict(key="tenants", name="Tenants", description="Register and manage resident access", icon="users"),
    dict(key="complaints", name="Complaints", description="Residents can raise and track maintenance issues", icon="message-square-warning"),
    dict(key="visitor_booking", name="Visitor Booking", description="Residents can pre-register expected visitors", icon="scan-line"),
    dict(key="utilities", name="Utilities & Billing", description="Water, electricity and other utility bills", icon="receipt"),
]


def seed_modules() -> None:
    db = SessionLocal()
    try:
        existing_keys = {m.key for m in db.query(Module).all()}
        for module_data in DEFAULT_MODULES:
            if module_data["key"] not in existing_keys:
                db.add(Module(**module_data))
        db.commit()
    finally:
        db.close()
