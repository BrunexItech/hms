import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr

from app.models.tenancy import TenancyStatus


class TenancyCreate(BaseModel):
    unit_id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: str | None = None
    start_date: date


class TenancyDisable(BaseModel):
    reason: str | None = None


class TenancyOut(BaseModel):
    id: uuid.UUID
    unit_id: uuid.UUID
    unit_name: str
    property_name: str
    tenant_id: uuid.UUID
    full_name: str
    email: str
    phone: str | None
    status: TenancyStatus
    start_date: date
    end_date: date | None
    created_at: datetime

    model_config = {"from_attributes": True}
