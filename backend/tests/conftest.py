import os
from pathlib import Path

# Must be set before the app (and its cached settings) is imported.
os.environ["DB_NAME"] = "hms_test"
os.environ["APP_ENV"] = "development"
os.environ["DEBUG"] = "false"
os.environ["SMTP_USER"] = ""
os.environ["SMTP_PASSWORD"] = ""

import psycopg2  # noqa: E402
import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.seed_modules import seed_modules  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.module import Module, OrganizationModule  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.property import Property  # noqa: E402
from app.models.staff_user import StaffRole, StaffUser  # noqa: E402
from app.models.tenancy import Tenancy  # noqa: E402
from app.models.tenant import Tenant  # noqa: E402
from app.models.unit import Unit, UnitStatus  # noqa: E402
from app.services import rate_limit  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parent.parent
PASSWORD = "CorrectHorse-9"


@pytest.fixture(scope="session", autouse=True)
def _database():
    """Build a fresh hms_test database from the real Alembic migrations, which
    also proves `alembic upgrade head` works on an empty database."""
    admin = psycopg2.connect(
        host=settings.DB_HOST, port=settings.DB_PORT, user=settings.DB_USER,
        password=settings.DB_PASSWORD, dbname="postgres",
    )
    admin.autocommit = True
    cur = admin.cursor()
    cur.execute("DROP DATABASE IF EXISTS hms_test WITH (FORCE)")
    cur.execute("CREATE DATABASE hms_test")
    # Test data is disposable — don't wait on disk flushes for every commit.
    cur.execute("ALTER DATABASE hms_test SET synchronous_commit = off")
    cur.close()
    admin.close()

    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    command.upgrade(cfg, "head")
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def _clean_state():
    rate_limit._hits.clear()
    with engine.begin() as conn:
        conn.execute(text("SET LOCAL session_replication_role = replica"))
        for table in Base.metadata.sorted_tables:
            conn.execute(text(f'DELETE FROM "{table.name}"'))
    seed_modules()
    yield


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def make_client() -> TestClient:
    return TestClient(app, base_url="http://localhost")


@pytest.fixture
def client():
    return make_client()


def csrf(client: TestClient) -> dict:
    return {"X-CSRF-Token": client.cookies.get("csrf_token") or ""}


def make_org(db, slug: str, enabled_modules: list[str] | None = None) -> Organization:
    org = Organization(name=slug.title(), slug=slug)
    db.add(org)
    db.flush()
    for module in db.query(Module).all():
        on = enabled_modules is None or module.key in enabled_modules
        db.add(OrganizationModule(organization_id=org.id, module_id=module.id, enabled=on))
    db.commit()
    return org


def make_staff(db, org, email: str, role=StaffRole.OWNER, password: str = PASSWORD) -> StaffUser:
    user = StaffUser(
        organization_id=org.id if org else None, email=email, hashed_password=hash_password(password),
        full_name=email.split("@")[0].title(), role=role,
    )
    db.add(user)
    db.commit()
    return user


def make_unit_with_tenant(db, org, tenant_email: str = "resident@example.com"):
    from datetime import date

    prop = Property(organization_id=org.id, name="Block A")
    db.add(prop)
    db.flush()
    unit = Unit(property_id=prop.id, name="A1", status=UnitStatus.OCCUPIED)
    db.add(unit)
    db.flush()
    tenant = Tenant(organization_id=org.id, full_name="Resident One", email=tenant_email)
    db.add(tenant)
    db.flush()
    tenancy = Tenancy(unit_id=unit.id, tenant_id=tenant.id, start_date=date(2026, 1, 1))
    db.add(tenancy)
    db.commit()
    return prop, unit, tenancy


def login_staff(client: TestClient, email: str, password: str = PASSWORD):
    return client.post("/api/v1/auth/staff/login", json={"email": email, "password": password})


def tenant_session(client: TestClient, unit, email: str = "resident@example.com"):
    res = client.post(f"/api/v1/auth/tenant/{unit.access_slug}/request", json={"email": email})
    link = res.json().get("dev_magic_link")
    assert link, res.text
    token = link.split("token=")[1]
    return client.post("/api/v1/auth/tenant/verify", json={"token": token})
