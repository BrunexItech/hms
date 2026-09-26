from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff, get_current_tenancy, require_module, require_module_for_tenant
from app.db.session import get_db
from app.models.property import Property
from app.models.staff_user import StaffUser
from app.models.tenancy import Tenancy
from app.models.unit import Unit
from app.models.utility import UtilityBill
from app.schemas.utility import UtilityBillBulkCreate, UtilityBillCreate, UtilityBillOut, UtilityBillUpdate
from app.services.audit import record_audit

router = APIRouter(tags=["utilities"])

MODULE_KEY = "utilities"


def _to_out(bill: UtilityBill) -> UtilityBillOut:
    out = UtilityBillOut.model_validate(bill)
    out.unit_name = bill.unit.name
    out.property_name = bill.unit.property.name
    return out


@router.post(
    "/staff/utility-bills", response_model=UtilityBillOut, dependencies=[Depends(require_module(MODULE_KEY))]
)
def create_utility_bill(payload: UtilityBillCreate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    unit = db.get(Unit, payload.unit_id)
    if unit is None or unit.property.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unit not found")
    bill = UtilityBill(**payload.model_dump())
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return _to_out(bill)


@router.post(
    "/staff/utility-bills/bulk", response_model=list[UtilityBillOut], dependencies=[Depends(require_module(MODULE_KEY))]
)
def bulk_create_utility_bills(payload: UtilityBillBulkCreate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    prop = db.get(Property, payload.property_id)
    if prop is None or prop.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")

    units = db.query(Unit).filter(Unit.property_id == prop.id).all()
    created: list[UtilityBill] = []
    for unit in units:
        bill = UtilityBill(
            unit_id=unit.id, utility_type=payload.utility_type, period_start=payload.period_start,
            period_end=payload.period_end, amount=payload.amount,
        )
        db.add(bill)
        created.append(bill)

    db.commit()
    for bill in created:
        db.refresh(bill)
    record_audit(
        db, "staff", "utility_bill.bulk_created", organization_id=staff.organization_id, actor_id=staff.id,
        meta={"property_id": str(prop.id), "count": len(created)},
    )
    return [_to_out(b) for b in created]


@router.get(
    "/staff/utility-bills", response_model=list[UtilityBillOut], dependencies=[Depends(require_module(MODULE_KEY))]
)
def list_org_utility_bills(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    bills = (
        db.query(UtilityBill)
        .join(Unit, Unit.id == UtilityBill.unit_id)
        .filter(Unit.property.has(organization_id=staff.organization_id))
        .order_by(UtilityBill.period_start.desc())
        .all()
    )
    return [_to_out(b) for b in bills]


@router.patch(
    "/staff/utility-bills/{bill_id}", response_model=UtilityBillOut, dependencies=[Depends(require_module(MODULE_KEY))]
)
def update_utility_bill_status(bill_id: str, payload: UtilityBillUpdate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    bill = db.get(UtilityBill, bill_id)
    if bill is None or bill.unit.property.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bill not found")
    bill.status = payload.status
    db.commit()
    db.refresh(bill)
    record_audit(
        db, "staff", "utility_bill.status_changed", organization_id=staff.organization_id, actor_id=staff.id,
        meta={"bill_id": str(bill.id), "status": payload.status.value},
    )
    return _to_out(bill)


@router.get(
    "/tenant/utility-bills", response_model=list[UtilityBillOut], dependencies=[Depends(require_module_for_tenant(MODULE_KEY))]
)
def list_my_utility_bills(tenancy: Tenancy = Depends(get_current_tenancy), db: Session = Depends(get_db)):
    return (
        db.query(UtilityBill)
        .filter(UtilityBill.unit_id == tenancy.unit_id)
        .order_by(UtilityBill.period_start.desc())
        .all()
    )
