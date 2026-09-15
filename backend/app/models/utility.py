import enum
import uuid
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class UtilityType(str, enum.Enum):
    WATER = "water"
    ELECTRICITY = "electricity"
    GARBAGE = "garbage"
    OTHER = "other"


class UtilityBillStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"


class UtilityBill(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "utility_bills"

    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False
    )
    utility_type: Mapped[UtilityType] = mapped_column(Enum(UtilityType, name="utility_type"))
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[UtilityBillStatus] = mapped_column(
        Enum(UtilityBillStatus, name="utility_bill_status"), default=UtilityBillStatus.PENDING
    )

    unit: Mapped["Unit"] = relationship()
