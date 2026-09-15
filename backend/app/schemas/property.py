import uuid
from datetime import datetime

from pydantic import BaseModel


class PropertyCreate(BaseModel):
    name: str
    address: str | None = None


class PropertyOut(BaseModel):
    id: uuid.UUID
    name: str
    address: str | None
    unit_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
