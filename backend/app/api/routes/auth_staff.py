from datetime import timedelta

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff
from app.core.config import settings
from app.core.security import create_token, decode_token, verify_password
from app.db.session import get_db
from app.models.staff_user import StaffUser
from app.schemas.auth import RefreshRequest, StaffLoginRequest, StaffMe, TokenPair
from app.services.audit import record_audit
from app.services.rate_limit import is_rate_limited

router = APIRouter(prefix="/auth/staff", tags=["auth-staff"])


def _issue_tokens(user: StaffUser) -> TokenPair:
    access = create_token(
        str(user.id), "staff", "access", timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh = create_token(
        str(user.id), "staff", "refresh", timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    return TokenPair(access_token=access, refresh_token=refresh)


@router.post("/login", response_model=TokenPair)
def login(payload: StaffLoginRequest, request: Request, db: Session = Depends(get_db)):
    if is_rate_limited(f"staff-login:{request.client.host if request.client else 'unknown'}", 10, 60):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts, slow down")

    user = db.query(StaffUser).filter(StaffUser.email == payload.email.lower()).first()
    generic_error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    if user is None or not user.is_active:
        raise generic_error

    if user.failed_login_attempts >= 5:
        raise HTTPException(
            status.HTTP_423_LOCKED, "Account temporarily locked after repeated failed attempts"
        )

    if not verify_password(payload.password, user.hashed_password):
        user.failed_login_attempts += 1
        db.commit()
        raise generic_error

    if user.mfa_enabled:
        if not payload.mfa_code or not pyotp.TOTP(user.mfa_secret).verify(payload.mfa_code, valid_window=1):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing MFA code")

    user.failed_login_attempts = 0
    db.commit()
    record_audit(db, "staff", "staff.login", organization_id=user.organization_id, actor_id=user.id)
    return _issue_tokens(user)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    data = decode_token(payload.refresh_token, audience="staff")
    if not data or data.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    user = db.query(StaffUser).filter(StaffUser.id == data["sub"]).first()
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found or disabled")
    return _issue_tokens(user)


@router.get("/me", response_model=StaffMe)
def me(staff: StaffUser = Depends(get_current_staff)):
    return staff


@router.post("/mfa/enroll")
def enroll_mfa(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    secret = pyotp.random_base32()
    staff.mfa_secret = secret
    staff.mfa_enabled = False
    db.commit()
    uri = pyotp.TOTP(secret).provisioning_uri(name=staff.email, issuer_name=settings.APP_NAME)
    return {"secret": secret, "provisioning_uri": uri}


@router.post("/mfa/activate")
def activate_mfa(code: str, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    if not staff.mfa_secret or not pyotp.TOTP(staff.mfa_secret).verify(code, valid_window=1):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid code")
    staff.mfa_enabled = True
    db.commit()
    return {"mfa_enabled": True}
