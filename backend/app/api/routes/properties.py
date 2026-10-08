from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff, require_owner_or_manager
from app.db.session import get_db
from app.models.property import Property
from app.models.staff_user import StaffUser
from app.models.unit import Unit
from app.schemas.property import PropertyCreate, PropertyOut, PropertyUpdate

router = APIRouter(prefix="/properties", tags=["properties"])


@router.post("", response_model=PropertyOut, dependencies=[Depends(require_owner_or_manager)])
def create_property(payload: PropertyCreate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    prop = Property(
        organization_id=staff.organization_id, name=payload.name, address=payload.address, photo_url=payload.photo_url
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    out = PropertyOut.model_validate(prop)
    out.unit_count = 0
    return out


@router.patch("/{property_id}", response_model=PropertyOut, dependencies=[Depends(require_owner_or_manager)])
def update_property(property_id: str, payload: PropertyUpdate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    prop = db.get(Property, property_id)
    if prop is None or prop.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prop, field, value)
    db.commit()
    db.refresh(prop)
    out = PropertyOut.model_validate(prop)
    out.unit_count = db.query(Unit).filter(Unit.property_id == prop.id).count()
    return out


@router.get("", response_model=list[PropertyOut])
def list_properties(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    rows = (
        db.query(Property, func.count(Unit.id))
        .outerjoin(Unit, Unit.property_id == Property.id)
        .filter(Property.organization_id == staff.organization_id)
        .group_by(Property.id)
        .order_by(Property.created_at.desc())
        .all()
    )
    results = []
    for prop, unit_count in rows:
        out = PropertyOut.model_validate(prop)
        out.unit_count = unit_count
        results.append(out)
    return results


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: str, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    prop = db.get(Property, property_id)
    if prop is None or prop.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    out = PropertyOut.model_validate(prop)
    out.unit_count = db.query(Unit).filter(Unit.property_id == prop.id).count()
    return out


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_owner_or_manager)])
def delete_property(property_id: str, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    prop = db.get(Property, property_id)
    if prop is None or prop.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")
    db.delete(prop)
    db.commit()
