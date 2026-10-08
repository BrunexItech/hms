import uuid
from datetime import datetime

from pydantic import BaseModel


class PropertyCreate(BaseModel):
    name: str
    address: str | None = None
    photo_url: str | None = None


class PropertyUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    photo_url: str | None = None


class PropertyOut(BaseModel):
    id: uuid.UUID
    name: str
    address: str | None
    photo_url: str | None = None
    unit_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
