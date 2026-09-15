import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str
    slug: str = Field(pattern=r"^[a-z0-9-]+$")
    owner_email: str
    owner_password: str
    owner_full_name: str
    primary_color: str = "#7C3AED"


class OrganizationUpdate(BaseModel):
    name: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None


class OrganizationOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    logo_url: str | None
    primary_color: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
