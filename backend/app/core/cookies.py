from fastapi import Response

from app.core.config import settings
from app.core.security import generate_url_safe_token

CSRF_COOKIE_NAME = "csrf_token"


def _secure() -> bool:
    return settings.APP_ENV == "production"


def set_session_cookies(response: Response, audience: str, access_token: str, refresh_token: str) -> None:
    access_max_age = (
        settings.ACCESS_TOKEN_EXPIRE_MINUTES if audience == "staff" else settings.TENANT_ACCESS_TOKEN_EXPIRE_MINUTES
    ) * 60
    refresh_max_age = (
        (settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
        if audience == "staff"
        else (settings.TENANT_REFRESH_TOKEN_EXPIRE_HOURS * 3600)
    )
    response.set_cookie(
        f"{audience}_access", access_token, httponly=True, secure=_secure(), samesite="lax",
        max_age=access_max_age, path="/",
    )
    response.set_cookie(
        f"{audience}_refresh", refresh_token, httponly=True, secure=_secure(), samesite="lax",
        max_age=refresh_max_age, path="/",
    )
    # Double-submit CSRF token — readable by JS on purpose (it's not the
    # secret; the secret is that a cross-site page can't read it to forge
    # the matching header). Shared across both audiences.
    response.set_cookie(
        CSRF_COOKIE_NAME, generate_url_safe_token(), httponly=False, secure=_secure(), samesite="lax",
        max_age=refresh_max_age, path="/",
    )


def clear_session_cookies(response: Response, audience: str) -> None:
    response.delete_cookie(f"{audience}_access", path="/")
    response.delete_cookie(f"{audience}_refresh", path="/")
    response.delete_cookie(CSRF_COOKIE_NAME, path="/")
