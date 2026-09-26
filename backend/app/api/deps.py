import uuid

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.module import Module, OrganizationModule
from app.models.organization import Organization
from app.models.staff_user import StaffRole, StaffUser
from app.models.tenancy import Tenancy, TenancyStatus


def ensure_org_active(db: Session, organization_id: uuid.UUID | None) -> None:
    """Suspending an organization must actually lock its people out."""
    if organization_id is None:
        return
    org = db.get(Organization, organization_id)
    if org is None or not org.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This organization has been suspended")


def get_current_staff(request: Request, db: Session = Depends(get_db)) -> StaffUser:
    token = request.cookies.get("staff_access")
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_token(token, audience="staff")
    if not payload or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session")
    user = db.get(StaffUser, uuid.UUID(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found or disabled")
    ensure_org_active(db, user.organization_id)
    return user


def require_super_admin(staff: StaffUser = Depends(get_current_staff)) -> StaffUser:
    if staff.role != StaffRole.SUPER_ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Super admin access required")
    return staff


def require_owner_or_manager(staff: StaffUser = Depends(get_current_staff)) -> StaffUser:
    if staff.role not in (StaffRole.OWNER, StaffRole.MANAGER):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Landlord/manager access required")
    return staff


def require_owner(staff: StaffUser = Depends(get_current_staff)) -> StaffUser:
    if staff.role != StaffRole.OWNER:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Owner access required")
    return staff


def get_current_tenancy(request: Request, db: Session = Depends(get_db)) -> Tenancy:
    token = request.cookies.get("tenant_access")
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_token(token, audience="tenant")
    if not payload or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session")
    tenancy = db.get(Tenancy, uuid.UUID(payload["sub"]))
    if tenancy is None or tenancy.status != TenancyStatus.ACTIVE:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Access has been revoked")
    ensure_org_active(db, tenancy.unit.property.organization_id)
    return tenancy


def require_module(module_key: str):
    def _dependency(
        staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)
    ) -> None:
        _assert_module_enabled(db, staff.organization_id, module_key)

    return _dependency


def require_module_for_tenant(module_key: str):
    def _dependency(
        tenancy: Tenancy = Depends(get_current_tenancy), db: Session = Depends(get_db)
    ) -> None:
        organization_id = tenancy.unit.property.organization_id
        _assert_module_enabled(db, organization_id, module_key)

    return _dependency


def _assert_module_enabled(db: Session, organization_id: uuid.UUID | None, module_key: str) -> None:
    if organization_id is None:
        return  # platform/super-admin context, not module-gated
    module = db.query(Module).filter(Module.key == module_key).first()
    if module is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown module")
    setting = (
        db.query(OrganizationModule)
        .filter(
            OrganizationModule.organization_id == organization_id,
            OrganizationModule.module_id == module.id,
        )
        .first()
    )
    if setting is None or not setting.enabled:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, f"The '{module.name}' module is not enabled for this account"
        )
