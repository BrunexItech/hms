from datetime import datetime, timedelta, timezone

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import ensure_org_active, get_current_staff
from app.core.config import settings
from app.core.cookies import clear_session_cookies, set_session_cookies
from app.core.security import create_token, decode_token, hash_password, verify_password
from app.db.session import get_db
from app.models.staff_user import StaffUser
from app.schemas.auth import ChangePasswordIn, StaffLoginRequest, StaffMe
from app.services.audit import record_audit
from app.services.rate_limit import is_rate_limited

router = APIRouter(prefix="/auth/staff", tags=["auth-staff"])

MAX_FAILED_LOGINS = 5
LOCKOUT_MINUTES = 15


def _issue_session(response: Response, user: StaffUser) -> None:
    access = create_token(
        str(user.id), "staff", "access", timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh = create_token(
        str(user.id), "staff", "refresh", timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    set_session_cookies(response, "staff", access, refresh)


@router.post("/login", response_model=StaffMe)
def login(payload: StaffLoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    if is_rate_limited(f"staff-login:{request.client.host if request.client else 'unknown'}", 10, 60):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts, slow down")

    user = db.query(StaffUser).filter(StaffUser.email == payload.email.lower()).first()
    generic_error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    if user is None or not user.is_active:
        raise generic_error

    now = datetime.now(timezone.utc)
    if user.locked_until is not None:
        if user.locked_until > now:
            minutes = max(1, int((user.locked_until - now).total_seconds() // 60) + 1)
            raise HTTPException(
                status.HTTP_423_LOCKED, f"Too many failed attempts. Try again in {minutes} minute(s)."
            )
        user.locked_until = None
        user.failed_login_attempts = 0

    def fail(detail: str | None = None):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_FAILED_LOGINS:
            user.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            user.failed_login_attempts = 0
        db.commit()
        return HTTPException(status.HTTP_401_UNAUTHORIZED, detail) if detail else generic_error

    if not verify_password(payload.password, user.hashed_password):
        raise fail()

    ensure_org_active(db, user.organization_id)

    if user.mfa_enabled:
        if not payload.mfa_code or not pyotp.TOTP(user.mfa_secret).verify(payload.mfa_code, valid_window=1):
            raise fail("Invalid or missing MFA code")

    user.failed_login_attempts = 0
    db.commit()
    record_audit(db, "staff", "staff.login", organization_id=user.organization_id, actor_id=user.id)
    _issue_session(response, user)
    return user


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("staff_refresh")
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    data = decode_token(token, audience="staff")
    if not data or data.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session")
    user = db.query(StaffUser).filter(StaffUser.id == data["sub"]).first()
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found or disabled")
    ensure_org_active(db, user.organization_id)
    _issue_session(response, user)
    return {"message": "ok"}


@router.post("/logout")
def logout(response: Response):
    clear_session_cookies(response, "staff")
    return {"message": "Logged out"}


@router.post("/change-password")
def change_password(payload: ChangePasswordIn, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, staff.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your current password is incorrect")
    if payload.current_password == payload.new_password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Choose a password different from your current one")
    staff.hashed_password = hash_password(payload.new_password)
    db.commit()
    record_audit(db, "staff", "staff.password_changed", organization_id=staff.organization_id, actor_id=staff.id)
    return {"message": "Password updated"}


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
