import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

TokenAudience = Literal["staff", "tenant"]


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_token(
    subject: str,
    audience: TokenAudience,
    token_type: Literal["access", "refresh"],
    expires_delta: timedelta,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "aud": audience,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": secrets.token_hex(16),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str, audience: TokenAudience) -> dict[str, Any] | None:
    try:
        return jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], audience=audience
        )
    except JWTError:
        return None


def generate_url_safe_token() -> str:
    return secrets.token_urlsafe(32)


def hash_lookup_value(value: str) -> str:
    """One-way hash for values we must compare later (OTP tokens) but never
    want recoverable from the database alone."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def generate_random_slug(length: int = 12) -> str:
    return secrets.token_urlsafe(length)[:length]


def constant_time_compare(a: str, b: str) -> bool:
    return secrets.compare_digest(a, b)
