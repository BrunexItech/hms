import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

RentInvoiceStatus = Literal["pending", "partially_paid", "paid", "overdue"]


class RentInvoiceCreate(BaseModel):
    unit_id: uuid.UUID
    period_start: date
    period_end: date
    amount_due: float
    due_date: date


class RentInvoiceBulkCreate(BaseModel):
    property_id: uuid.UUID
    period_start: date
    period_end: date
    amount_due: float
    due_date: date


class RentPaymentCreate(BaseModel):
    amount: float
    method: str = "cash"
    paid_at: date
    notes: str | None = None


class RentPaymentOut(BaseModel):
    id: uuid.UUID
    amount: float
    method: str
    paid_at: date
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class RentInvoiceOut(BaseModel):
    id: uuid.UUID
    unit_id: uuid.UUID
    unit_name: str
    property_name: str
    tenant_name: str
    period_start: date
    period_end: date
    amount_due: float
    due_date: date
    total_paid: float
    status: RentInvoiceStatus
    payments: list[RentPaymentOut]
    created_at: datetime
