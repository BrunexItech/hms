from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_staff, get_current_tenancy, require_module, require_module_for_tenant
from app.db.session import get_db
from app.models.staff_user import StaffUser
from app.models.tenancy import Tenancy
from app.models.unit import Unit
from app.models.visitor import VisitorBooking
from app.schemas.visitor import VisitorBookingCreate, VisitorBookingOut, VisitorBookingUpdate

router = APIRouter(tags=["visitors"])

MODULE_KEY = "visitor_booking"


def _to_out(v: VisitorBooking) -> VisitorBookingOut:
    out = VisitorBookingOut.model_validate(v)
    out.tenant_name = v.tenancy.tenant.full_name
    out.unit_name = v.tenancy.unit.name
    return out


@router.post(
    "/tenant/visitors", response_model=VisitorBookingOut, dependencies=[Depends(require_module_for_tenant(MODULE_KEY))]
)
def create_visitor_booking(payload: VisitorBookingCreate, tenancy: Tenancy = Depends(get_current_tenancy), db: Session = Depends(get_db)):
    booking = VisitorBooking(tenancy_id=tenancy.id, **payload.model_dump())
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _to_out(booking)


@router.get(
    "/tenant/visitors", response_model=list[VisitorBookingOut], dependencies=[Depends(require_module_for_tenant(MODULE_KEY))]
)
def list_my_visitor_bookings(tenancy: Tenancy = Depends(get_current_tenancy), db: Session = Depends(get_db)):
    bookings = db.query(VisitorBooking).filter(VisitorBooking.tenancy_id == tenancy.id).order_by(VisitorBooking.visit_date.desc()).all()
    return [_to_out(b) for b in bookings]


@router.get(
    "/staff/visitors", response_model=list[VisitorBookingOut], dependencies=[Depends(require_module(MODULE_KEY))]
)
def list_org_visitor_bookings(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    bookings = (
        db.query(VisitorBooking)
        .join(VisitorBooking.tenancy)
        .options(joinedload(VisitorBooking.tenancy).joinedload(Tenancy.tenant), joinedload(VisitorBooking.tenancy).joinedload(Tenancy.unit))
        .filter(Tenancy.unit.has(Unit.property.has(organization_id=staff.organization_id)))
        .order_by(VisitorBooking.visit_date.desc())
        .all()
    )
    return [_to_out(b) for b in bookings]


@router.patch(
    "/staff/visitors/{booking_id}", response_model=VisitorBookingOut, dependencies=[Depends(require_module(MODULE_KEY))]
)
def update_visitor_booking(booking_id: str, payload: VisitorBookingUpdate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    booking = db.get(VisitorBooking, booking_id)
    if booking is None or booking.tenancy.unit.property.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    booking.status = payload.status
    db.commit()
    db.refresh(booking)
    return _to_out(booking)
