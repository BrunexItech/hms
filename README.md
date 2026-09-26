# HMS — House Management System

A multi-tenant house/property management platform. One super-admin controls which
modules (Properties, Tenants, Rent, Complaints, Visitor Booking, Utilities) are
enabled per business; each business (Organization) manages its own properties,
units, and residents; residents get invite-only, passwordless access via a
per-unit QR code/link.

## Stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL, Alembic migrations, httpOnly
  cookie sessions (staff and tenant are separate sessions) with CSRF protection.
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind v4.

## First-time setup

```bash
# 1. Start Postgres
docker compose up -d postgres

# 2. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SECRET_KEY, DB_PASSWORD, SUPER_ADMIN_EMAIL/PASSWORD
python seed.py          # runs migrations + creates the super-admin account
uvicorn app.main:app --reload --port 8010

# 3. Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env.local  # or set NEXT_PUBLIC_API_URL
npm run dev -- --port 3010
```

## Where things live

- Platform admin: `http://localhost:3010/admin/login` — creates organizations,
  toggles which modules each one has access to, can suspend a business.
- Business login: `http://localhost:3010/login` — for the Owner/Manager
  accounts of a specific organization.
- Residents never register — a landlord registers their email against a unit,
  then shares that unit's QR/link (`/access/<slug>`). Signing in sends a
  single-use magic link to the registered email (or, if no SMTP is configured,
  prints it to the backend console / shows it directly in the UI in non-production).

## Database migrations

Schema is owned by Alembic (`backend/alembic/`), not auto-created on boot.

```bash
cd backend && source venv/bin/activate
alembic upgrade head                                   # apply pending migrations
alembic revision --autogenerate -m "describe the change"  # after changing a model
```

## Known gaps (not yet built)

- Real SMTP is optional — without it, tenant sign-in links only work via the
  dev-mode link shown in the UI / backend logs.
- No automated test suite.
- No production Dockerfile / deploy pipeline yet (dev-only `docker-compose.yml`
  covers Postgres only).
- No document/photo upload, CSV export, or SMS reminders.
