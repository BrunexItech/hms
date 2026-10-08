from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.unit import Unit

router = APIRouter(prefix="/public", tags=["public"])


class UnitAccessInfo(BaseModel):
    unit_name: str
    property_name: str
    property_photo_url: str | None
    organization_name: str
    organization_logo_url: str | None
    organization_primary_color: str


@router.get("/units/{access_slug}", response_model=UnitAccessInfo)
def get_unit_access_info(access_slug: str, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.access_slug == access_slug).first()
    if unit is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This access link is invalid")
    org = unit.property.organization
    return UnitAccessInfo(
        unit_name=unit.name,
        property_name=unit.property.name,
        property_photo_url=unit.property.photo_url,
        organization_name=org.name,
        organization_logo_url=org.logo_url,
        organization_primary_color=org.primary_color,
    )
