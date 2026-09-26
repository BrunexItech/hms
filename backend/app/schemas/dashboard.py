from pydantic import BaseModel


class MonthlyRevenuePoint(BaseModel):
    month: str  # "2026-04"
    collected: float


class DashboardSummaryOut(BaseModel):
    properties_enabled: bool
    total_properties: int | None = None
    total_units: int | None = None
    occupied_units: int | None = None
    vacant_units: int | None = None
    occupancy_rate: float | None = None

    tenants_enabled: bool
    active_tenants: int | None = None

    complaints_enabled: bool
    open_complaints: int | None = None

    visitor_booking_enabled: bool
    pending_visitors: int | None = None

    rent_enabled: bool
    rent_due_this_month: float | None = None
    rent_collected_this_month: float | None = None
    rent_outstanding: float | None = None
    monthly_revenue: list[MonthlyRevenuePoint] | None = None

    utilities_enabled: bool
    utilities_outstanding: float | None = None
