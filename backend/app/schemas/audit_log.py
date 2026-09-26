import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID | None
    actor_type: str
    actor_id: uuid.UUID | None
    action: str
    meta: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
