from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff, require_owner_or_manager
from app.core.config import settings
from app.core.security import generate_random_slug
from app.db.session import get_db
from app.models.property import Property
from app.models.staff_user import StaffUser
from app.models.unit import Unit
from app.schemas.unit import UnitAccessLinkOut, UnitCreate, UnitOut
from app.services.audit import record_audit

router = APIRouter(tags=["units"])


def _get_owned_property(db: Session, staff: StaffUser, property_id: str) -> Property:
    prop = db.get(Property, property_id)
    if prop is None or prop.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    return prop


def _get_owned_unit(db: Session, staff: StaffUser, unit_id: str) -> Unit:
    unit = db.get(Unit, unit_id)
    if unit is None or unit.property.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unit not found")
    return unit


@router.get("/units", response_model=list[UnitOut])
def list_all_units(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    return (
        db.query(Unit)
        .join(Property, Property.id == Unit.property_id)
        .filter(Property.organization_id == staff.organization_id)
        .order_by(Property.name, Unit.name)
        .all()
    )


@router.post("/properties/{property_id}/units", response_model=UnitOut, dependencies=[Depends(require_owner_or_manager)])
def create_unit(property_id: str, payload: UnitCreate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    prop = _get_owned_property(db, staff, property_id)
    unit = Unit(property_id=prop.id, name=payload.name)
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


@router.get("/properties/{property_id}/units", response_model=list[UnitOut])
def list_units(property_id: str, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    _get_owned_property(db, staff, property_id)
    return db.query(Unit).filter(Unit.property_id == property_id).order_by(Unit.created_at.desc()).all()


@router.get("/units/{unit_id}/access-link", response_model=UnitAccessLinkOut, dependencies=[Depends(require_owner_or_manager)])
def get_access_link(unit_id: str, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    unit = _get_owned_unit(db, staff, unit_id)
    return UnitAccessLinkOut(
        access_url=f"{settings.FRONTEND_URL}/access/{unit.access_slug}", access_slug=unit.access_slug
    )


@router.post("/units/{unit_id}/regenerate-access-link", response_model=UnitAccessLinkOut, dependencies=[Depends(require_owner_or_manager)])
def regenerate_access_link(unit_id: str, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    unit = _get_owned_unit(db, staff, unit_id)
    unit.access_slug = generate_random_slug()
    db.commit()
    record_audit(db, "staff", "unit.access_link_regenerated", organization_id=staff.organization_id, actor_id=staff.id, meta={"unit_id": str(unit.id)})
    return UnitAccessLinkOut(
        access_url=f"{settings.FRONTEND_URL}/access/{unit.access_slug}", access_slug=unit.access_slug
    )
