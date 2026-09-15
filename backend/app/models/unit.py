import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.security import generate_random_slug
from app.db.base import Base, TimestampMixin, UUIDPKMixin


class UnitStatus(str, enum.Enum):
    VACANT = "vacant"
    OCCUPIED = "occupied"


class Unit(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "units"

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[UnitStatus] = mapped_column(
        Enum(UnitStatus, name="unit_status"), default=UnitStatus.VACANT
    )
    # Public, non-sequential, regenerate-able identifier used in the QR code /
    # access link. Kept separate from `id` so a landlord can invalidate an old
    # physical QR code (e.g. after a tenant vacates) by rotating this value
    # without breaking any foreign keys that reference the unit.
    access_slug: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, default=generate_random_slug
    )

    property: Mapped["Property"] = relationship(back_populates="units")
    tenancies: Mapped[list["Tenancy"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan"
    )
