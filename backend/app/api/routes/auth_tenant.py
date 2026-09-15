from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenancy
from app.core.config import settings
from app.core.security import create_token, decode_token, generate_url_safe_token, hash_lookup_value
from app.db.session import get_db
from app.models.access_request import TenantAccessRequest
from app.models.tenancy import Tenancy, TenancyStatus
from app.models.unit import Unit
from app.schemas.auth import RefreshRequest, TenantAccessRequestIn, TenantAccessVerifyIn, TenantMe, TokenPair
from app.services.email import send_tenant_access_link
from app.services.rate_limit import is_rate_limited

router = APIRouter(prefix="/auth/tenant", tags=["auth-tenant"])

GENERIC_RESPONSE = {
    "message": "If that email is registered for this unit, a sign-in link has been sent."
}


@router.post("/{access_slug}/request")
def request_access(
    access_slug: str,
    payload: TenantAccessRequestIn,
    request: Request,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    # Rate limit per-IP and per-(unit+email) so the public endpoint can't be
    # used to spam a resident's inbox or brute-force which emails are valid.
    if is_rate_limited(f"tenant-otp-ip:{client_ip}", settings.RATE_LIMIT_OTP_PER_HOUR, 3600):
        return GENERIC_RESPONSE
    if is_rate_limited(f"tenant-otp:{access_slug}:{payload.email.lower()}", settings.RATE_LIMIT_OTP_PER_HOUR, 3600):
        return GENERIC_RESPONSE

    unit = db.query(Unit).filter(Unit.access_slug == access_slug).first()
    if unit is None:
        return GENERIC_RESPONSE

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
    if tenancy is None:
        return GENERIC_RESPONSE

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
    send_tenant_access_link(tenancy.tenant.email, tenancy.tenant.full_name, magic_link)
    return GENERIC_RESPONSE


def _issue_tenant_tokens(tenancy_id: str) -> TokenPair:
    access = create_token(
        tenancy_id, "tenant", "access", timedelta(minutes=settings.TENANT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh = create_token(
        tenancy_id, "tenant", "refresh", timedelta(hours=settings.TENANT_REFRESH_TOKEN_EXPIRE_HOURS)
    )
    return TokenPair(access_token=access, refresh_token=refresh)


@router.post("/verify", response_model=TokenPair)
def verify(payload: TenantAccessVerifyIn, db: Session = Depends(get_db)):
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

    access_request.used_at = now
    db.commit()
    return _issue_tenant_tokens(str(tenancy.id))


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    data = decode_token(payload.refresh_token, audience="tenant")
    if not data or data.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    tenancy = db.get(Tenancy, data["sub"])
    if tenancy is None or tenancy.status != TenancyStatus.ACTIVE:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Access has been revoked")
    return _issue_tenant_tokens(str(tenancy.id))


@router.get("/me", response_model=TenantMe)
def me(tenancy: Tenancy = Depends(get_current_tenancy)):
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
    )
