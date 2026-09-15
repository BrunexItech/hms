from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff, get_current_tenancy, require_super_admin
from app.db.session import get_db
from app.models.module import Module, OrganizationModule
from app.models.organization import Organization
from app.models.staff_user import StaffUser
from app.models.tenancy import Tenancy
from app.schemas.module import ModuleOut, ModuleToggleIn
from app.services.audit import record_audit

router = APIRouter(tags=["modules"])

TENANT_FACING_MODULE_KEYS = {"complaints", "visitor_booking", "utilities"}


@router.get("/modules/tenant-me", response_model=list[ModuleOut])
def my_tenant_modules(tenancy: Tenancy = Depends(get_current_tenancy), db: Session = Depends(get_db)):
    """Enabled, tenant-relevant modules for the current resident's
    organization — drives which sections of the resident portal render."""
    organization_id = tenancy.unit.property.organization_id
    rows = (
        db.query(Module, OrganizationModule)
        .join(OrganizationModule, OrganizationModule.module_id == Module.id)
        .filter(OrganizationModule.organization_id == organization_id, OrganizationModule.enabled.is_(True))
        .all()
    )
    return [
        ModuleOut(id=m.id, key=m.key, name=m.name, description=m.description, icon=m.icon, enabled=True)
        for m, _ in rows
        if m.key in TENANT_FACING_MODULE_KEYS
    ]


@router.get("/modules/me", response_model=list[ModuleOut])
def my_modules(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    """Modules enabled for the caller's own organization — used by the
    frontend to decide which sidebar items/routes to render."""
    if staff.organization_id is None:
        modules = db.query(Module).all()
        return [ModuleOut(id=m.id, key=m.key, name=m.name, description=m.description, icon=m.icon, enabled=True) for m in modules]

    rows = (
        db.query(Module, OrganizationModule)
        .join(OrganizationModule, OrganizationModule.module_id == Module.id)
        .filter(OrganizationModule.organization_id == staff.organization_id)
        .all()
    )
    return [
        ModuleOut(id=m.id, key=m.key, name=m.name, description=m.description, icon=m.icon, enabled=om.enabled)
        for m, om in rows
    ]


@router.get(
    "/organizations/{org_id}/modules",
    response_model=list[ModuleOut],
    dependencies=[Depends(require_super_admin)],
)
def list_org_modules(org_id: str, db: Session = Depends(get_db)):
    org = db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    rows = (
        db.query(Module, OrganizationModule)
        .outerjoin(
            OrganizationModule,
            (OrganizationModule.module_id == Module.id) & (OrganizationModule.organization_id == org_id),
        )
        .all()
    )
    return [
        ModuleOut(id=m.id, key=m.key, name=m.name, description=m.description, icon=m.icon, enabled=bool(om and om.enabled))
        for m, om in rows
    ]


@router.put(
    "/organizations/{org_id}/modules/{module_id}",
    response_model=ModuleOut,
    dependencies=[Depends(require_super_admin)],
)
def toggle_org_module(
    org_id: str, module_id: str, payload: ModuleToggleIn, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)
):
    module = db.get(Module, module_id)
    if module is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Module not found")

    setting = (
        db.query(OrganizationModule)
        .filter(OrganizationModule.organization_id == org_id, OrganizationModule.module_id == module_id)
        .first()
    )
    if setting is None:
        setting = OrganizationModule(organization_id=org_id, module_id=module_id, enabled=payload.enabled)
        db.add(setting)
    else:
        setting.enabled = payload.enabled
    db.commit()

    record_audit(
        db, "super_admin", "module.toggled", organization_id=org_id, actor_id=staff.id,
        meta={"module_key": module.key, "enabled": payload.enabled},
    )
    return ModuleOut(id=module.id, key=module.key, name=module.name, description=module.description, icon=module.icon, enabled=payload.enabled)
