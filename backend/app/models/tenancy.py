import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class TenancyStatus(str, enum.Enum):
    ACTIVE = "active"
    VACATED = "vacated"
    DISABLED = "disabled"


class Tenancy(UUIDPKMixin, TimestampMixin, Base):
    """Time-bound link between a Tenant (person) and a Unit. This — not the
    Tenant record — is what a landlord disables when someone moves out, so
    history is preserved instead of deleted."""

    __tablename__ = "tenancies"

    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[TenancyStatus] = mapped_column(
        Enum(TenancyStatus, name="tenancy_status"), default=TenancyStatus.ACTIVE, index=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    disabled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    disabled_reason: Mapped[str | None] = mapped_column(String(300), nullable=True)

    unit: Mapped["Unit"] = relationship(back_populates="tenancies")
    tenant: Mapped["Tenant"] = relationship(back_populates="tenancies")
    complaints: Mapped[list["Complaint"]] = relationship(
        back_populates="tenancy", cascade="all, delete-orphan"
    )
    visitor_bookings: Mapped[list["VisitorBooking"]] = relationship(
        back_populates="tenancy", cascade="all, delete-orphan"
    )
    access_requests: Mapped[list["TenantAccessRequest"]] = relationship(
        back_populates="tenancy", cascade="all, delete-orphan"
    )
