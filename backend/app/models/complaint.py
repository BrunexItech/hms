import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class ComplaintStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class ComplaintPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Complaint(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "complaints"

    tenancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenancies.id", ondelete="CASCADE"), nullable=False
    )
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ComplaintStatus] = mapped_column(
        Enum(ComplaintStatus, name="complaint_status"), default=ComplaintStatus.OPEN
    )
    priority: Mapped[ComplaintPriority] = mapped_column(
        Enum(ComplaintPriority, name="complaint_priority"), default=ComplaintPriority.MEDIUM
    )
    vendor_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    vendor_contact: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cost: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    tenancy: Mapped["Tenancy"] = relationship(back_populates="complaints")
