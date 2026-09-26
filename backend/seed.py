"""Runs pending migrations, then creates the platform super-admin account
from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD in .env. Safe to re-run — does
nothing if the account already exists. Run with: python seed.py
"""
from alembic import command
from alembic.config import Config

from app import models  # noqa: F401
from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.db.seed_modules import seed_modules
from app.models.staff_user import StaffRole, StaffUser


def main() -> None:
    if not settings.SUPER_ADMIN_EMAIL or not settings.SUPER_ADMIN_PASSWORD:
        raise SystemExit("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env before seeding.")

    command.upgrade(Config("alembic.ini"), "head")
    seed_modules()

    db = SessionLocal()
    try:
        email = settings.SUPER_ADMIN_EMAIL.lower()
        existing = db.query(StaffUser).filter(StaffUser.email == email).first()
        if existing:
            print(f"Super admin already exists: {email}")
            return

        admin = StaffUser(
            organization_id=None,
            email=email,
            hashed_password=hash_password(settings.SUPER_ADMIN_PASSWORD),
            full_name=settings.SUPER_ADMIN_NAME,
            role=StaffRole.SUPER_ADMIN,
        )
        db.add(admin)
        db.commit()
        print(f"Super admin created: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
