from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import ensure_org_active, get_current_tenancy
from app.core.config import settings
from app.core.cookies import clear_session_cookies, set_session_cookies
from app.core.security import create_token, decode_token, generate_url_safe_token, hash_lookup_value
from app.db.session import get_db
from app.models.access_request import TenantAccessRequest
from app.models.tenancy import Tenancy, TenancyStatus
from app.models.unit import Unit
from app.schemas.auth import TenantAccessRequestIn, TenantAccessVerifyIn, TenantMe
from app.services.email import send_tenant_access_link
from app.services.rate_limit import is_rate_limited

router = APIRouter(prefix="/auth/tenant", tags=["auth-tenant"])

GENERIC_MESSAGE = "If that email is registered for this unit, a sign-in link has been sent."


@router.post("/{access_slug}/request")
def request_access(
    access_slug: str,
    payload: TenantAccessRequestIn,
    request: Request,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    generic_response = {"message": GENERIC_MESSAGE}

    # Rate limit per-IP and per-(unit+email) so the public endpoint can't be
    # used to spam a resident's inbox or brute-force which emails are valid.
    if is_rate_limited(f"tenant-otp-ip:{client_ip}", settings.RATE_LIMIT_OTP_PER_HOUR, 3600):
        return generic_response
    if is_rate_limited(f"tenant-otp:{access_slug}:{payload.email.lower()}", settings.RATE_LIMIT_OTP_PER_HOUR, 3600):
        return generic_response

    unit = db.query(Unit).filter(Unit.access_slug == access_slug).first()
    if unit is None:
        return generic_response

    tenancy = (
        db.query(Tenancy)
        .join(Tenancy.tenant)
        .filter(
            Tenancy.unit_id == unit.id,
            Tenancy.status == TenancyStatus.ACTIVE,
        )
        .filter(Tenancy.tenant.has(email=payload.email.lower()))
        .first()
    )
    if tenancy is None or not tenancy.unit.property.organization.is_active:
        return generic_response

    raw_token = generate_url_safe_token()
    access_request = TenantAccessRequest(
        tenancy_id=tenancy.id,
        token_hash=hash_lookup_value(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_LINK_EXPIRE_MINUTES),
        requested_ip=client_ip,
    )
    db.add(access_request)
    db.commit()

    magic_link = f"{settings.FRONTEND_URL}/access/verify?token={raw_token}"
    email_sent = send_tenant_access_link(tenancy.tenant.email, tenancy.tenant.full_name, magic_link)

    # Outside production, if no real SMTP is configured, hand the link back
    # directly so the flow is testable without reading server logs. Never
    # done in production, and never done once SMTP is actually wired up.
    if settings.APP_ENV != "production" and not settings.SMTP_USER:
        return {**generic_response, "dev_magic_link": magic_link}

    return generic_response


def _issue_session(response: Response, tenancy_id: str) -> None:
    access = create_token(
        tenancy_id, "tenant", "access", timedelta(minutes=settings.TENANT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh = create_token(
        tenancy_id, "tenant", "refresh", timedelta(hours=settings.TENANT_REFRESH_TOKEN_EXPIRE_HOURS)
    )
    set_session_cookies(response, "tenant", access, refresh)


@router.post("/verify", response_model=TenantMe)
def verify(payload: TenantAccessVerifyIn, response: Response, db: Session = Depends(get_db)):
    token_hash = hash_lookup_value(payload.token)
    access_request = (
        db.query(TenantAccessRequest).filter(TenantAccessRequest.token_hash == token_hash).first()
    )
    now = datetime.now(timezone.utc)
    if (
        access_request is None
        or access_request.used_at is not None
        or access_request.expires_at < now
    ):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This link is invalid or has expired")

    tenancy = db.get(Tenancy, access_request.tenancy_id)
    if tenancy is None or tenancy.status != TenancyStatus.ACTIVE:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access to this unit has been revoked")
    ensure_org_active(db, tenancy.unit.property.organization_id)

    access_request.used_at = now
    db.commit()
    _issue_session(response, str(tenancy.id))
    return _to_tenant_me(tenancy)


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("tenant_refresh")
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    data = decode_token(token, audience="tenant")
    if not data or data.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session")
    tenancy = db.get(Tenancy, data["sub"])
    if tenancy is None or tenancy.status != TenancyStatus.ACTIVE:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Access has been revoked")
    ensure_org_active(db, tenancy.unit.property.organization_id)
    _issue_session(response, str(tenancy.id))
    return {"message": "ok"}


@router.post("/logout")
def logout(response: Response):
    clear_session_cookies(response, "tenant")
    return {"message": "Logged out"}


def _to_tenant_me(tenancy: Tenancy) -> TenantMe:
    return TenantMe(
        tenancy_id=tenancy.id,
        tenant_id=tenancy.tenant.id,
        full_name=tenancy.tenant.full_name,
        email=tenancy.tenant.email,
        unit_id=tenancy.unit.id,
        unit_name=tenancy.unit.name,
        property_name=tenancy.unit.property.name,
        organization_id=tenancy.unit.property.organization_id,
        organization_name=tenancy.unit.property.organization.name,
        organization_logo_url=tenancy.unit.property.organization.logo_url,
        organization_primary_color=tenancy.unit.property.organization.primary_color,
    )


@router.get("/me", response_model=TenantMe)
def me(tenancy: Tenancy = Depends(get_current_tenancy)):
    return _to_tenant_me(tenancy)
