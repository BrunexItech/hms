from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.cookies import CSRF_COOKIE_NAME
from app.core.security import constant_time_compare

MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Endpoints that establish or destroy a session don't carry ambient authority
# yet, so they're exempt from the double-submit check. Every /auth/tenant/*
# mutation is exempt for the same reason (request/verify/refresh/logout).
EXEMPT_PATHS = {
    "/api/v1/auth/staff/login",
    "/api/v1/auth/staff/refresh",
    "/api/v1/auth/staff/logout",
}


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if request.method in MUTATING_METHODS and path not in EXEMPT_PATHS and not path.startswith(
            "/api/v1/auth/tenant/"
        ):
            cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
            header_token = request.headers.get("x-csrf-token")
            if not cookie_token or not header_token or not constant_time_compare(cookie_token, header_token):
                return JSONResponse({"detail": "CSRF token missing or invalid"}, status_code=403)
        return await call_next(request)
