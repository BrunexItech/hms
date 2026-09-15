import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.unit import UnitStatus


class UnitCreate(BaseModel):
    name: str


class UnitOut(BaseModel):
    id: uuid.UUID
    property_id: uuid.UUID
    name: str
    status: UnitStatus
    access_slug: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UnitAccessLinkOut(BaseModel):
    access_url: str
    access_slug: str
