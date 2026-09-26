import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.staff_user import StaffRole


class StaffInviteIn(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class StaffResetPasswordIn(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class StaffMemberOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: StaffRole
    is_active: bool
    mfa_enabled: bool
    created_at: datetime

    model_config = {"from_attributes": True}
