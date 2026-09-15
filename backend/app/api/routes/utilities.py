from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff, get_current_tenancy, require_module, require_module_for_tenant
from app.db.session import get_db
from app.models.staff_user import StaffUser
from app.models.tenancy import Tenancy
from app.models.unit import Unit
from app.models.utility import UtilityBill
from app.schemas.utility import UtilityBillCreate, UtilityBillOut

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
