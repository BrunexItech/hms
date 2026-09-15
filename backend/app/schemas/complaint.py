import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.complaint import ComplaintPriority, ComplaintStatus


class ComplaintCreate(BaseModel):
    subject: str
    description: str
    priority: ComplaintPriority = ComplaintPriority.MEDIUM


class ComplaintUpdate(BaseModel):
    status: ComplaintStatus


class ComplaintOut(BaseModel):
    id: uuid.UUID
    subject: str
    description: str
    status: ComplaintStatus
    priority: ComplaintPriority
    created_at: datetime
    tenant_name: str | None = None
    unit_name: str | None = None

    model_config = {"from_attributes": True}
