import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.module import Module, OrganizationModule
from app.models.staff_user import StaffRole, StaffUser
from app.models.tenancy import Tenancy, TenancyStatus

staff_bearer = HTTPBearer(auto_error=False)
tenant_bearer = HTTPBearer(auto_error=False)


def get_current_staff(
    creds: HTTPAuthorizationCredentials | None = Depends(staff_bearer),
    db: Session = Depends(get_db),
) -> StaffUser:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_token(creds.credentials, audience="staff")
    if not payload or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = db.get(StaffUser, uuid.UUID(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found or disabled")
    return user


def require_super_admin(staff: StaffUser = Depends(get_current_staff)) -> StaffUser:
    if staff.role != StaffRole.SUPER_ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Super admin access required")
    return staff


def require_owner_or_manager(staff: StaffUser = Depends(get_current_staff)) -> StaffUser:
    if staff.role not in (StaffRole.OWNER, StaffRole.MANAGER):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Landlord/manager access required")
    return staff


def get_current_tenancy(
    creds: HTTPAuthorizationCredentials | None = Depends(tenant_bearer),
    db: Session = Depends(get_db),
) -> Tenancy:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_token(creds.credentials, audience="tenant")
    if not payload or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    tenancy = db.get(Tenancy, uuid.UUID(payload["sub"]))
    if tenancy is None or tenancy.status != TenancyStatus.ACTIVE:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Access has been revoked")
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
