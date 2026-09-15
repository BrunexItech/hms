import uuid
from datetime import date, datetime, time

from pydantic import BaseModel

from app.models.visitor import VisitorStatus


class VisitorBookingCreate(BaseModel):
    visitor_name: str
    visitor_phone: str | None = None
    visit_date: date
    expected_time: time | None = None
    purpose: str | None = None


class VisitorBookingUpdate(BaseModel):
    status: VisitorStatus


class VisitorBookingOut(BaseModel):
    id: uuid.UUID
    visitor_name: str
    visitor_phone: str | None
    visit_date: date
    expected_time: time | None
    purpose: str | None
    status: VisitorStatus
    created_at: datetime
    tenant_name: str | None = None
    unit_name: str | None = None

    model_config = {"from_attributes": True}
