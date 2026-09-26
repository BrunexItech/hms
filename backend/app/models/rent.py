import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class RentInvoice(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "rent_invoices"

    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False
    )
    tenancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenancies.id", ondelete="CASCADE"), nullable=False
    )
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    amount_due: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)

    unit: Mapped["Unit"] = relationship()
    tenancy: Mapped["Tenancy"] = relationship()
    payments: Mapped[list["RentPayment"]] = relationship(
        back_populates="invoice", cascade="all, delete-orphan", order_by="RentPayment.paid_at, RentPayment.created_at"
    )


class RentPayment(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "rent_payments"

    invoice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rent_invoices.id", ondelete="CASCADE"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    method: Mapped[str] = mapped_column(String(32), default="cash")
    paid_at: Mapped[date] = mapped_column(Date, nullable=False)
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("staff_users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(String(300), nullable=True)

    invoice: Mapped["RentInvoice"] = relationship(back_populates="payments")
