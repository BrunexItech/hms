from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class Organization(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    primary_color: Mapped[str] = mapped_column(String(20), default="#7C3AED")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    properties: Mapped[list["Property"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    staff_users: Mapped[list["StaffUser"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    tenants: Mapped[list["Tenant"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    module_settings: Mapped[list["OrganizationModule"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
