# HMS — House Management System

A multi-tenant property management platform. One **platform admin** controls which
modules each business can use; each business (**organization**) manages its own
properties, units, residents, rent and complaints; **residents never register** — a
landlord adds their email to a unit, and they sign in through that unit's QR code/link
with a single-use email link.

- [How it works](#how-it-works)
- [Local setup](#local-setup)
- [Configuration reference](#configuration-reference)
- [Email setup](#email-setup) ← required before real residents can sign in
- [Going to production](#going-to-production)
- [Operating the platform](#operating-the-platform)
- [Security model](#security-model)
- [Known gaps](#known-gaps)
- [Troubleshooting](#troubleshooting)

---

## How it works

| Who | Signs in at | Can do |
|---|---|---|
| **Platform admin** | `/admin/login` | Create organizations, switch modules on/off per organization, suspend/reactivate a business, view its activity log |
| **Owner** (landlord) | `/login` | Everything in their organization, plus team management, activity log, branding |
| **Manager** | `/login` | Day-to-day work (properties, tenants, rent, complaints…); cannot manage the team |
| **Resident** | `/access/<unit-slug>` (QR/link) | Only their own unit: rent, utilities, complaints, visitor bookings |

Hierarchy: **Organization → Property → Unit → Tenancy → Tenant**. A tenancy (not the
person) is what a landlord disables when someone moves out, so history is kept.

**Modules** (switchable per organization by the platform admin, enforced on the server):
Properties & Units, Tenants, Rent & Payments, Utilities & Billing, Complaints, Visitor Booking.

**Resident access:** the QR/link only opens a sign-in page. The resident must enter the
email the landlord registered; a single-use link (valid 10 minutes) is sent to it. Disabling
the tenancy revokes an already-signed-in resident on their very next request.

**Stack:** FastAPI + SQLAlchemy + PostgreSQL + Alembic (backend); Next.js (App Router) +
TypeScript + Tailwind v4 (frontend). Sessions are httpOnly cookies with CSRF protection.

---

## Local setup

Requires: Python 3.10+, Node 20+, Docker (for Postgres).

```bash
# 1. Postgres. docker-compose reads the ROOT .env, so create it first.
cat > .env <<'EOF'
DB_NAME=hms
DB_USER=hms
DB_PASSWORD=pick-a-local-password
EOF
docker compose up -d postgres          # listens on localhost:5433

# 2. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`backend/.env.example` ships with **production-style defaults**. For local work edit these
in `backend/.env`:

```ini
APP_ENV=development
DEBUG=true
DB_HOST=localhost
DB_PORT=5433
DB_PASSWORD=pick-a-local-password      # must match the root .env
SECRET_KEY=<output of: openssl rand -hex 32>
SUPER_ADMIN_EMAIL=you@example.com
SUPER_ADMIN_PASSWORD=a-long-password   # 8+ characters
FRONTEND_URL=http://localhost:3010
ALLOWED_ORIGINS=["http://localhost:3010"]
```

```bash
python seed.py                          # runs migrations + creates the platform admin
uvicorn app.main:app --reload --port 8010

# 3. Frontend (second terminal)
cd frontend
npm install
cp .env.example .env.local              # NEXT_PUBLIC_API_URL=http://localhost:8010/api/v1
npm run dev -- --port 3010
```

Open <http://localhost:3010/admin/login>, create an organization (this also creates its
Owner account), then sign in as that owner at `/login`.

In development, when no SMTP is configured, the resident sign-in page shows the sign-in
link on screen ("Development mode" box) and the backend also prints it — so you can test
the whole resident flow without email.

### Tests

```bash
cd backend && source venv/bin/activate
pytest -q          # ~1 minute; needs Postgres running
```

The suite creates and drops its own `hms_test` database (so the DB user needs
`CREATE DATABASE`) and builds it from the Alembic migrations, which doubles as a check that a
fresh install works. It covers tenant isolation, CSRF, revoke-on-vacate, single-use links,
module gating, organization suspension, lockout, and billing/dashboard maths. There are no
frontend tests yet.

### Migrations

Schema is owned by Alembic — the app never creates tables on boot.

```bash
alembic upgrade head                                         # apply pending migrations
alembic revision --autogenerate -m "describe the change"     # after editing a model; review the file
```

---

## Configuration reference

All backend settings are environment variables (or `backend/.env`).

| Variable | Default | Notes |
|---|---|---|
| `APP_ENV` | `development` | **`production` turns on `Secure` cookies (HTTPS required) and disables the on-screen dev sign-in link.** |
| `DEBUG` | `true` | Set `false` in production — otherwise `/docs` (the full API explorer) is public. |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASSWORD` | localhost / 5432 / hms / hms / hms | Change the password. |
| `SECRET_KEY` | placeholder | Signs every session. Long random value (`openssl rand -hex 32`). Changing it signs everyone out. |
| `SUPER_ADMIN_EMAIL` / `_PASSWORD` / `_NAME` | empty | Only read by `python seed.py`. Remove the password from the server's environment after seeding, then change it from the admin **Account** page. |
| `FRONTEND_URL` | `http://localhost:3000` | **Public URL of the site.** Used to build resident sign-in links and unit QR codes — see [QR codes](#qr-codes-and-the-public-url). |
| `ALLOWED_ORIGINS` | `["http://localhost:3010"]` | JSON list (double quotes). Only matters if the browser calls the API from a different origin. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | 30 / 7 | Staff sessions. |
| `TENANT_ACCESS_TOKEN_EXPIRE_MINUTES` / `TENANT_REFRESH_TOKEN_EXPIRE_HOURS` | 60 / 24 | Resident sessions (deliberately shorter). |
| `ACCESS_LINK_EXPIRE_MINUTES` | 10 | Lifetime of a resident's emailed sign-in link. |
| `RATE_LIMIT_OTP_PER_HOUR` | 5 | Sign-in-link requests per IP and per unit+email. |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASSWORD` `SMTP_FROM_EMAIL` `SMTP_FROM_NAME` | see below | See [Email setup](#email-setup). |

`HOST`/`PORT` also appear in `.env.example` but uvicorn does not read them — pass
`--host`/`--port` on the command line. Staff lockout (5 failed logins → 15 minutes) and
the 10-logins-per-minute-per-IP limit are constants in code.

Frontend: `NEXT_PUBLIC_API_URL` — the API base URL the browser calls. It is **baked in at
build time**, so changing it means rebuilding.

---

## Email setup

**Today the only email the system sends is the resident sign-in link.** (No password-reset,
no rent reminders, no complaint notifications — see [Known gaps](#known-gaps).) Without
working email, residents cannot sign in in production.

### What happens with and without SMTP

| Situation | Result |
|---|---|
| `APP_ENV=development`, no SMTP | Link shown on the sign-in page and printed in the backend log |
| `APP_ENV=production`, no SMTP | Link is only printed in the log — **residents cannot sign in** |
| SMTP configured | Link is emailed; never shown on screen |

SMTP counts as configured only when **both** `SMTP_USER` and `SMTP_PASSWORD` are set.

### Option A — Gmail / Google Workspace (fine to start)

1. Turn on 2-Step Verification for the Google account.
2. Create an **App Password** (Google Account → Security → App passwords). A normal password will not work.
3. Set:

```ini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=<the 16-character app password>
SMTP_FROM_EMAIL=yourname@gmail.com      # keep equal to SMTP_USER, or Gmail rewrites the sender
SMTP_FROM_NAME=Your Business Name
```

Gmail allows roughly 500 messages/day (2,000 on Workspace) and often lands mail in spam.

### Option B — a transactional provider (recommended for real use)

Amazon SES, SendGrid, Mailgun, Postmark, Resend, Brevo, etc. all offer SMTP credentials.
Map their SMTP host / username / password onto the same variables — no code change. Send from
a domain you own and set up **SPF, DKIM and DMARC** DNS records for it, otherwise sign-in
emails will be filtered as spam and residents will think the system is broken.

### Constraints of the current implementation

- It uses SMTP with **STARTTLS, so port 587**. Port 465 (implicit TLS) is not supported.
- A send failure is logged as `[email:error] …` in the backend log but the resident still sees
  the normal "if that email is registered, a link is on its way" message (by design — it must not
  reveal which emails are registered). **Watch the logs after configuring email.**
- The SMTP call has no timeout, so a wrong `SMTP_HOST` can stall the request. Test before go-live.

### Test your SMTP settings

```bash
cd backend && source venv/bin/activate
python -c "from app.services.email import send_email; print(send_email('you@yourdomain.com','HMS test','<p>It works</p>'))"
```

`True` plus an email in your inbox means it works. `False` prints the error. With no SMTP
configured it prints `[email:dev-mode]` and returns `True` — that is *not* a real send.

Then do the real check: register your own email on a test unit, open its `/access/<slug>`
link on your phone, and sign in from the email.

---

## Going to production

### Supported topology: one domain, reverse proxy in front

Serve the site and the API from **the same domain** (e.g. `https://hms.example.com`, with
`/api/` routed to the backend and everything else to the frontend). Browser-side sessions
depend on this.

> **Not supported without code changes: splitting them across subdomains** (`app.` and
> `api.`). The session cookies are host-only, so the site could not read the CSRF cookie the
> API sets and every write would be rejected. (`localhost:3010` + `localhost:8010` works in
> development only because cookies ignore port numbers.)

Build the frontend for that layout so the browser calls the same origin:

```bash
cd frontend
NEXT_PUBLIC_API_URL=/api/v1 npm run build     # needs internet: fetches Google Fonts (see Known gaps)
npm run start -- --port 3010
```

Backend (run migrations and seed **once**, before starting workers):

```bash
cd backend && source venv/bin/activate
alembic upgrade head
python seed.py                                  # first deploy only; safe to re-run
uvicorn app.main:app --host 127.0.0.1 --port 8010 --workers 2 \
        --proxy-headers --forwarded-allow-ips 127.0.0.1
```

Why those flags: behind a proxy every request appears to come from the proxy's IP, so the
per-IP rate limits would be shared by all your users. `--proxy-headers` with the proxy's
address makes uvicorn use the real client IP from `X-Forwarded-For`. Running seed first
avoids two workers racing to insert the module list on an empty database.

### Example nginx (adapt; not tested in this repo)

```nginx
server {
    listen 443 ssl http2;
    server_name hms.example.com;
    # ssl_certificate / ssl_certificate_key … (Let's Encrypt, Cloudflare Origin cert, etc.)

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /api/ {
        proxy_pass http://127.0.0.1:8010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
server { listen 80; server_name hms.example.com; return 301 https://$host$request_uri; }
```

The app itself sets no HSTS or other security headers — put them in the proxy as above.
HTTPS is mandatory: with `APP_ENV=production` cookies are marked `Secure` and will not be set
over plain HTTP.

### Keep the processes alive

Nothing restarts the backend or frontend if they crash or the server reboots. Use systemd,
pm2, or containers. Minimal systemd unit (example):

```ini
[Unit]
Description=HMS backend
After=network.target postgresql.service

[Service]
WorkingDirectory=/srv/hms/backend
EnvironmentFile=/srv/hms/backend/.env
ExecStart=/srv/hms/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8010 --workers 2 --proxy-headers --forwarded-allow-ips 127.0.0.1
Restart=always
User=hms

[Install]
WantedBy=multi-user.target
```

Create a matching unit for the frontend (`npm run start -- --port 3010`). There are **no
Dockerfiles yet**; the included `docker-compose.yml` is for local Postgres only.

### Database

- Use a managed Postgres, or your own with a persistent volume. The dev `docker-compose.yml`
  publishes port 5433 on all interfaces — **do not use it as-is on a public server**.
- **Back it up.** It holds residents' details and your financial records. At minimum a nightly
  `pg_dump -Fc hms > hms-$(date +%F).dump`, copied off the machine, and do one restore test.
- Run `alembic upgrade head` on every deploy that includes a new migration.

### Production checklist

- [ ] `APP_ENV=production`, `DEBUG=false`
- [ ] New random `SECRET_KEY`; strong `DB_PASSWORD`; DB not exposed to the internet
- [ ] `FRONTEND_URL` set to the final `https://` domain **before printing any QR codes**
- [ ] Frontend built with `NEXT_PUBLIC_API_URL=/api/v1`
- [ ] HTTPS working; proxy passes `X-Forwarded-For`; uvicorn started with `--proxy-headers`
- [ ] SMTP configured and the real resident sign-in test passed (phone, from the email)
- [ ] Platform-admin password changed from the **Account** page; `SUPER_ADMIN_PASSWORD` removed from the server env
- [ ] Process manager in place; nightly database backup running and restore tested
- [ ] A privacy notice for residents — you store names, emails and phone numbers; check your obligations under local data-protection law (e.g. Kenya's Data Protection Act)

### QR codes and the public URL

Every unit QR/link encodes `FRONTEND_URL` **as it was when the code was generated**. If you
print QR codes while `FRONTEND_URL` is `localhost` or a staging domain and change it later,
the printed codes still point at the old address. Set the final domain first; if it ever
changes, use **Regenerate** on each unit (which also invalidates the old code) and reprint.

---

## Operating the platform

**Onboard a business:** `/admin` → *New organization* → enter the business and its owner's
details → give the owner their temporary password (there is no email invite yet) → they sign in
at `/login` and change it in *Settings*. Use the organization page to switch modules off for
businesses that shouldn't have them.

**Onboard a resident:** Properties → open the property → *Tenant* on a unit → enter name,
email, move-in date. Open *Access* on the unit to copy the link, or *Print for door / gate* for
the QR sheet. The resident enters that exact email to receive their sign-in link.

**Move-out:** Tenants → *Disable*. Their access ends immediately and the unit becomes vacant.
Use *Regenerate* on the unit if the old QR sticker was copied around.

**Suspend a business:** admin → organization → *Suspend*. Its staff and residents are locked
out immediately; *Reactivate* restores them.

**Forgot password**
- A manager: the owner uses *Team → Reset password*.
- An owner or the platform admin: there is no self-service reset yet. Run on the server:

```bash
cd backend && source venv/bin/activate && python - <<'EOF'
from app.db.session import SessionLocal
from app.models.staff_user import StaffUser
from app.core.security import hash_password
db = SessionLocal()
u = db.query(StaffUser).filter(StaffUser.email == "person@example.com").first()
u.hashed_password = hash_password("A-New-Password-123")
u.failed_login_attempts, u.locked_until = 0, None
db.commit()
EOF
```

**Two-factor for the platform admin:** the API exists (`POST /auth/staff/mfa/enroll`, then
`POST /auth/staff/mfa/activate?code=…`) but there is no screen for it yet, so today it means
calling the API by hand (mutating calls need the `X-CSRF-Token` header).

---

## Security model

- **Sessions:** httpOnly cookies (`SameSite=Lax`, `Secure` in production); staff and resident
  sessions are separate. Every state-changing request needs a matching CSRF header.
- **Isolation:** every query is scoped to the caller's organization and re-checked on each request;
  tests cover cross-organization access attempts.
- **Residents:** invite-only. The link/QR alone grants nothing; unknown emails get the same response
  as registered ones; links are single-use, hashed at rest, and expire in 10 minutes; a disabled
  tenancy or suspended organization is rejected on the next request even with a valid session.
- **Staff:** Argon2 password hashes, 5 failed logins → 15-minute lockout, per-IP rate limiting.
- **Modules** are enforced on the server, not just hidden in the UI.
- **Audit log** records logins, tenancy/team/module/branding changes, and rent and billing actions.

Limits worth knowing: the rate limiter is in-memory (resets on restart, not shared between
processes/servers); logging out clears the cookie but does not revoke a refresh token that was
already stolen; expired sign-in links and audit entries are never purged.

---

## Known gaps

Not built yet, roughly by importance:

1. **Email:** only the sign-in link is sent. Missing: staff forgot-password, owner invite emails, rent-due reminders, complaint updates. SMS is not available.
2. **Deployment:** no Dockerfiles or CI; no log shipping/monitoring/error tracking.
3. **Fonts:** the site downloads Google Fonts at build/dev time; a network blip fails the build. Self-host them (`next/font/local`) for reliable builds.
4. **Scale:** lists are not paginated or searchable, and the dashboard aggregates in Python — fine for hundreds of units, not tens of thousands.
5. **Account security:** no MFA screen, no self-service password reset for owners/admin, no refresh-token revocation.
6. **Records:** no editing/deleting of properties and units in the UI, no moving a tenant between units, no co-tenant view, no rent receipts/statements, no CSV export.
7. **Files:** no uploads (ID documents, leases, complaint photos).
8. **Complaints:** status only — no replies or attachments.
9. **Frontend tests:** none (backend has 27).
10. **Deployment topology:** site and API must share one domain (see above).

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Pages spin forever / "Something went wrong" | Backend isn't running: `curl localhost:8010/health` |
| Everything returns 401 right after login | Site and API on different hosts, or `APP_ENV=production` over plain HTTP (cookies rejected) |
| Writes fail with 403 "CSRF token missing or invalid" | Cookies blocked/cleared, or the site and API are on different domains |
| Resident says the email never arrived | Check backend log for `[email:error]`; SMTP not configured in production; spam folder; SPF/DKIM missing |
| Sign-in link says invalid or expired | Older than 10 minutes, already used, or the tenancy was disabled/organization suspended |
| Owner "locked out" | 5 wrong passwords → wait 15 minutes, or use the manual reset above |
| `docker compose` says `DB_PASSWORD` is missing | The **root** `.env` (next to `docker-compose.yml`) is missing |
| `alembic` can't connect | `backend/.env` DB settings don't match the running Postgres (`DB_HOST=localhost`, `DB_PORT=5433` locally) |
| `npm run build` fails fetching fonts | No internet during build — retry, or self-host the fonts |
| Many users get "Too many attempts" | Running behind a proxy without `--proxy-headers`: everyone shares one IP |
