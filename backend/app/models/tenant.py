import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class Tenant(UUIDPKMixin, TimestampMixin, Base):
    """A person. Registered by a landlord/manager against a unit before they
    can ever log in — see Tenancy for the actual access grant."""

    __tablename__ = "tenants"
    __table_args__ = (UniqueConstraint("organization_id", "email", name="uq_tenant_org_email"),)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)

    organization: Mapped["Organization"] = relationship(back_populates="tenants")
    tenancies: Mapped[list["Tenancy"]] = relationship(
        back_populates="tenant", cascade="all, delete-orphan"
    )
