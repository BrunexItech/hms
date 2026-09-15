import uuid

from pydantic import BaseModel, EmailStr

from app.models.staff_user import StaffRole


class StaffLoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_code: str | None = None


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class StaffMe(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: StaffRole
    organization_id: uuid.UUID | None
    mfa_enabled: bool

    model_config = {"from_attributes": True}


class TenantAccessRequestIn(BaseModel):
    email: EmailStr


class TenantAccessVerifyIn(BaseModel):
    token: str


class TenantMe(BaseModel):
    tenancy_id: uuid.UUID
    tenant_id: uuid.UUID
    full_name: str
    email: str
    unit_id: uuid.UUID
    unit_name: str
    property_name: str
    organization_id: uuid.UUID
    organization_name: str
