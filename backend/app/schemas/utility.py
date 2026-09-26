import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.utility import UtilityBillStatus, UtilityType


class UtilityBillCreate(BaseModel):
    unit_id: uuid.UUID
    utility_type: UtilityType
    period_start: date
    period_end: date
    amount: float


class UtilityBillBulkCreate(BaseModel):
    property_id: uuid.UUID
    utility_type: UtilityType
    period_start: date
    period_end: date
    amount: float


class UtilityBillOut(BaseModel):
    id: uuid.UUID
    unit_id: uuid.UUID
    unit_name: str | None = None
    property_name: str | None = None
    utility_type: UtilityType
    period_start: date
    period_end: date
    amount: float
    status: UtilityBillStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class UtilityBillUpdate(BaseModel):
    status: UtilityBillStatus
