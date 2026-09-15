import uuid

from pydantic import BaseModel


class ModuleOut(BaseModel):
    id: uuid.UUID
    key: str
    name: str
    description: str | None
    icon: str
    enabled: bool

    model_config = {"from_attributes": True}


class ModuleToggleIn(BaseModel):
    enabled: bool
