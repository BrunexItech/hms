from calendar import monthrange
from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.complaint import Complaint, ComplaintStatus
from app.models.module import Module, OrganizationModule
from app.models.property import Property
from app.models.rent import RentInvoice, RentPayment
from app.models.staff_user import StaffUser
from app.models.tenancy import Tenancy, TenancyStatus
from app.models.unit import Unit, UnitStatus
from app.models.utility import UtilityBill, UtilityBillStatus
from app.models.visitor import VisitorBooking, VisitorStatus
from app.schemas.dashboard import DashboardSummaryOut, MonthlyRevenuePoint

router = APIRouter(tags=["dashboard"])


def _module_enabled(db: Session, organization_id, key: str) -> bool:
    if organization_id is None:
        return False
    row = (
        db.query(OrganizationModule)
        .join(Module, Module.id == OrganizationModule.module_id)
        .filter(OrganizationModule.organization_id == organization_id, Module.key == key)
        .first()
    )
    return bool(row and row.enabled)


def _month_bounds(anchor: date) -> tuple[date, date]:
    start = anchor.replace(day=1)
    end = date(start.year, start.month, monthrange(start.year, start.month)[1])
    return start, end


def _months_back(anchor: date, count: int) -> list[date]:
    """First-of-month dates for `count` months ending at anchor's month, oldest first."""
    result = []
    year, month = anchor.year, anchor.month
    for _ in range(count):
        result.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(result))


@router.get("/staff/dashboard/summary", response_model=DashboardSummaryOut)
def dashboard_summary(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    org_id = staff.organization_id
    out = DashboardSummaryOut(
        properties_enabled=_module_enabled(db, org_id, "properties"),
        tenants_enabled=_module_enabled(db, org_id, "tenants"),
        complaints_enabled=_module_enabled(db, org_id, "complaints"),
        visitor_booking_enabled=_module_enabled(db, org_id, "visitor_booking"),
        rent_enabled=_module_enabled(db, org_id, "rent"),
        utilities_enabled=_module_enabled(db, org_id, "utilities"),
    )
    if org_id is None:
        return out

    if out.properties_enabled:
        out.total_properties = db.query(Property).filter(Property.organization_id == org_id).count()
        units = db.query(Unit).join(Property, Property.id == Unit.property_id).filter(Property.organization_id == org_id).all()
        out.total_units = len(units)
        out.occupied_units = sum(1 for u in units if u.status == UnitStatus.OCCUPIED)
        out.vacant_units = out.total_units - out.occupied_units
        out.occupancy_rate = round((out.occupied_units / out.total_units) * 100, 1) if out.total_units else 0.0

    if out.tenants_enabled:
        out.active_tenants = (
            db.query(Tenancy)
            .join(Unit, Unit.id == Tenancy.unit_id)
            .join(Property, Property.id == Unit.property_id)
            .filter(Property.organization_id == org_id, Tenancy.status == TenancyStatus.ACTIVE)
            .count()
        )

    if out.complaints_enabled:
        out.open_complaints = (
            db.query(Complaint)
            .join(Tenancy, Tenancy.id == Complaint.tenancy_id)
            .join(Unit, Unit.id == Tenancy.unit_id)
            .join(Property, Property.id == Unit.property_id)
            .filter(
                Property.organization_id == org_id,
                Complaint.status.in_([ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS]),
            )
            .count()
        )

    if out.visitor_booking_enabled:
        out.pending_visitors = (
            db.query(VisitorBooking)
            .join(Tenancy, Tenancy.id == VisitorBooking.tenancy_id)
            .join(Unit, Unit.id == Tenancy.unit_id)
            .join(Property, Property.id == Unit.property_id)
            .filter(Property.organization_id == org_id, VisitorBooking.status == VisitorStatus.PENDING)
            .count()
        )

    if out.rent_enabled:
        today = date.today()
        month_start, month_end = _month_bounds(today)

        invoices = (
            db.query(RentInvoice)
            .join(Unit, Unit.id == RentInvoice.unit_id)
            .join(Property, Property.id == Unit.property_id)
            .filter(Property.organization_id == org_id)
            .all()
        )
        out.rent_due_this_month = sum(
            float(inv.amount_due) for inv in invoices if month_start <= inv.due_date <= month_end
        )

        outstanding = 0.0
        for inv in invoices:
            paid = sum(float(p.amount) for p in inv.payments)
            if paid < float(inv.amount_due):
                outstanding += float(inv.amount_due) - paid
        out.rent_outstanding = round(outstanding, 2)

        payments = (
            db.query(RentPayment)
            .join(RentInvoice, RentInvoice.id == RentPayment.invoice_id)
            .join(Unit, Unit.id == RentInvoice.unit_id)
            .join(Property, Property.id == Unit.property_id)
            .filter(Property.organization_id == org_id)
            .all()
        )
        out.rent_collected_this_month = round(
            sum(float(p.amount) for p in payments if month_start <= p.paid_at <= month_end), 2
        )

        by_month: dict[str, float] = defaultdict(float)
        for p in payments:
            by_month[p.paid_at.strftime("%Y-%m")] += float(p.amount)
        months = _months_back(today, 6)
        out.monthly_revenue = [
            MonthlyRevenuePoint(month=m.strftime("%Y-%m"), collected=round(by_month.get(m.strftime("%Y-%m"), 0.0), 2))
            for m in months
        ]

    if out.utilities_enabled:
        bills = (
            db.query(UtilityBill)
            .join(Unit, Unit.id == UtilityBill.unit_id)
            .join(Property, Property.id == Unit.property_id)
            .filter(
                Property.organization_id == org_id,
                UtilityBill.status.in_([UtilityBillStatus.PENDING, UtilityBillStatus.OVERDUE]),
            )
            .all()
        )
        out.utilities_outstanding = round(sum(float(b.amount) for b in bills), 2)

    return out
