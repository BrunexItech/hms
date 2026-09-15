from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_staff, require_owner_or_manager
from app.db.session import get_db
from app.models.staff_user import StaffUser
from app.models.tenancy import Tenancy, TenancyStatus
from app.models.tenant import Tenant
from app.models.unit import Unit, UnitStatus
from app.schemas.tenancy import TenancyCreate, TenancyDisable, TenancyOut
from app.services.audit import record_audit

router = APIRouter(prefix="/tenancies", tags=["tenancies"])


def _to_out(t: Tenancy) -> TenancyOut:
    return TenancyOut(
        id=t.id,
        unit_id=t.unit_id,
        unit_name=t.unit.name,
        property_name=t.unit.property.name,
        tenant_id=t.tenant_id,
        full_name=t.tenant.full_name,
        email=t.tenant.email,
        phone=t.tenant.phone,
        status=t.status,
        start_date=t.start_date,
        end_date=t.end_date,
        created_at=t.created_at,
    )


@router.post("", response_model=TenancyOut, dependencies=[Depends(require_owner_or_manager)])
def create_tenancy(payload: TenancyCreate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    unit = db.get(Unit, payload.unit_id)
    if unit is None or unit.property.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unit not found")

    tenant = (
        db.query(Tenant)
        .filter(Tenant.organization_id == staff.organization_id, Tenant.email == payload.email.lower())
        .first()
    )
    if tenant is None:
        tenant = Tenant(
            organization_id=staff.organization_id,
            full_name=payload.full_name,
            email=payload.email.lower(),
            phone=payload.phone,
        )
        db.add(tenant)
        db.flush()

    existing = (
        db.query(Tenancy)
        .filter(Tenancy.unit_id == unit.id, Tenancy.tenant_id == tenant.id, Tenancy.status == TenancyStatus.ACTIVE)
        .first()
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "This tenant already has active access to this unit")

    tenancy = Tenancy(unit_id=unit.id, tenant_id=tenant.id, start_date=payload.start_date)
    db.add(tenancy)
    unit.status = UnitStatus.OCCUPIED
    db.commit()
    db.refresh(tenancy)
    record_audit(
        db, "staff", "tenancy.created", organization_id=staff.organization_id, actor_id=staff.id,
        meta={"unit_id": str(unit.id), "tenant_email": tenant.email},
    )
    return _to_out(tenancy)


@router.get("", response_model=list[TenancyOut])
def list_tenancies(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    tenancies = (
        db.query(Tenancy)
        .join(Tenancy.unit)
        .options(joinedload(Tenancy.unit).joinedload(Unit.property), joinedload(Tenancy.tenant))
        .filter(Unit.property.has(organization_id=staff.organization_id))
        .order_by(Tenancy.created_at.desc())
        .all()
    )
    return [_to_out(t) for t in tenancies]


@router.post("/{tenancy_id}/disable", response_model=TenancyOut, dependencies=[Depends(require_owner_or_manager)])
def disable_tenancy(tenancy_id: str, payload: TenancyDisable, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    tenancy = db.get(Tenancy, tenancy_id)
    if tenancy is None or tenancy.unit.property.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tenancy not found")

    tenancy.status = TenancyStatus.VACATED
    tenancy.disabled_at = datetime.now(timezone.utc)
    tenancy.disabled_reason = payload.reason
    tenancy.end_date = tenancy.end_date or datetime.now(timezone.utc).date()

    remaining_active = (
        db.query(Tenancy)
        .filter(Tenancy.unit_id == tenancy.unit_id, Tenancy.status == TenancyStatus.ACTIVE, Tenancy.id != tenancy.id)
        .count()
    )
    if remaining_active == 0:
        tenancy.unit.status = UnitStatus.VACANT

    db.commit()
    db.refresh(tenancy)
    record_audit(
        db, "staff", "tenancy.disabled", organization_id=staff.organization_id, actor_id=staff.id,
        meta={"tenancy_id": str(tenancy.id), "reason": payload.reason},
    )
    return _to_out(tenancy)


@router.post("/{tenancy_id}/reactivate", response_model=TenancyOut, dependencies=[Depends(require_owner_or_manager)])
def reactivate_tenancy(tenancy_id: str, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    tenancy = db.get(Tenancy, tenancy_id)
    if tenancy is None or tenancy.unit.property.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tenancy not found")
    tenancy.status = TenancyStatus.ACTIVE
    tenancy.disabled_at = None
    tenancy.disabled_reason = None
    tenancy.end_date = None
    tenancy.unit.status = UnitStatus.OCCUPIED
    db.commit()
    db.refresh(tenancy)
    record_audit(db, "staff", "tenancy.reactivated", organization_id=staff.organization_id, actor_id=staff.id, meta={"tenancy_id": str(tenancy.id)})
    return _to_out(tenancy)
