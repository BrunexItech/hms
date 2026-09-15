import enum
import uuid
from datetime import date, time

from sqlalchemy import Date, Enum, ForeignKey, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class VisitorStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"


class VisitorBooking(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "visitor_bookings"

    tenancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenancies.id", ondelete="CASCADE"), nullable=False
    )
    visitor_name: Mapped[str] = mapped_column(String(200), nullable=False)
    visitor_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(300), nullable=True)
    status: Mapped[VisitorStatus] = mapped_column(
        Enum(VisitorStatus, name="visitor_status"), default=VisitorStatus.PENDING
    )

    tenancy: Mapped["Tenancy"] = relationship(back_populates="visitor_bookings")
