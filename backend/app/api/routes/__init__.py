from fastapi import APIRouter

from app.api.routes import (
    audit_logs,
    auth_staff,
    auth_tenant,
    complaints,
    dashboard,
    modules,
    organizations,
    properties,
    public,
    rent,
    staff,
    tenancies,
    units,
    utilities,
    visitors,
)

api_router = APIRouter()
api_router.include_router(auth_staff.router)
api_router.include_router(auth_tenant.router)
api_router.include_router(public.router)
api_router.include_router(organizations.router)
api_router.include_router(properties.router)
api_router.include_router(units.router)
api_router.include_router(tenancies.router)
api_router.include_router(modules.router)
api_router.include_router(complaints.router)
api_router.include_router(visitors.router)
api_router.include_router(utilities.router)
api_router.include_router(rent.router)
api_router.include_router(staff.router)
api_router.include_router(audit_logs.router)
api_router.include_router(dashboard.router)
