import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class TenantAccessRequest(UUIDPKMixin, TimestampMixin, Base):
    """A single-use, short-lived magic-link login request for a tenant.

    Only the sha256 hash of the raw token is stored — the raw value only ever
    exists in the emailed link and in memory for the moment it's issued.
    """

    __tablename__ = "tenant_access_requests"

    tenancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenancies.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    requested_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)

    tenancy: Mapped["Tenancy"] = relationship(back_populates="access_requests")
