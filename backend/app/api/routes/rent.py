import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_staff, get_current_tenancy, require_module, require_module_for_tenant
from app.db.session import get_db
from app.models.property import Property
from app.models.rent import RentInvoice, RentPayment
from app.models.staff_user import StaffUser
from app.models.tenancy import Tenancy, TenancyStatus
from app.models.unit import Unit
from app.schemas.rent import RentInvoiceBulkCreate, RentInvoiceCreate, RentInvoiceOut, RentPaymentCreate, RentPaymentOut
from app.services.audit import record_audit

router = APIRouter(tags=["rent"])

MODULE_KEY = "rent"


def _to_out(invoice: RentInvoice) -> RentInvoiceOut:
    total_paid = sum(float(p.amount) for p in invoice.payments)
    amount_due = float(invoice.amount_due)
    if total_paid >= amount_due:
        rent_status = "paid"
    elif total_paid > 0:
        rent_status = "partially_paid"
    elif invoice.due_date < date.today():
        rent_status = "overdue"
    else:
        rent_status = "pending"

    return RentInvoiceOut(
        id=invoice.id,
        unit_id=invoice.unit_id,
        unit_name=invoice.unit.name,
        property_name=invoice.unit.property.name,
        tenant_name=invoice.tenancy.tenant.full_name,
        period_start=invoice.period_start,
        period_end=invoice.period_end,
        amount_due=amount_due,
        due_date=invoice.due_date,
        total_paid=total_paid,
        status=rent_status,
        payments=[RentPaymentOut.model_validate(p) for p in invoice.payments],
        created_at=invoice.created_at,
    )


def _active_tenancy_for_unit(db: Session, unit_id) -> Tenancy | None:
    return (
        db.query(Tenancy)
        .filter(Tenancy.unit_id == unit_id, Tenancy.status == TenancyStatus.ACTIVE)
        .order_by(Tenancy.created_at.desc())
        .first()
    )


@router.post("/staff/rent-invoices", response_model=RentInvoiceOut, dependencies=[Depends(require_module(MODULE_KEY))])
def create_rent_invoice(payload: RentInvoiceCreate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    unit = db.get(Unit, payload.unit_id)
    if unit is None or unit.property.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unit not found")
    tenancy = _active_tenancy_for_unit(db, unit.id)
    if tenancy is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This unit has no active tenant to bill")

    invoice = RentInvoice(
        unit_id=unit.id, tenancy_id=tenancy.id, period_start=payload.period_start, period_end=payload.period_end,
        amount_due=payload.amount_due, due_date=payload.due_date,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return _to_out(invoice)


@router.post("/staff/rent-invoices/bulk", response_model=list[RentInvoiceOut], dependencies=[Depends(require_module(MODULE_KEY))])
def bulk_create_rent_invoices(payload: RentInvoiceBulkCreate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    prop = db.get(Property, payload.property_id)
    if prop is None or prop.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property not found")

    units = db.query(Unit).filter(Unit.property_id == prop.id).all()
    created: list[RentInvoice] = []
    for unit in units:
        tenancy = _active_tenancy_for_unit(db, unit.id)
        if tenancy is None:
            continue
        invoice = RentInvoice(
            unit_id=unit.id, tenancy_id=tenancy.id, period_start=payload.period_start, period_end=payload.period_end,
            amount_due=payload.amount_due, due_date=payload.due_date,
        )
        db.add(invoice)
        created.append(invoice)

    db.commit()
    for invoice in created:
        db.refresh(invoice)
    record_audit(
        db, "staff", "rent_invoice.bulk_created", organization_id=staff.organization_id, actor_id=staff.id,
        meta={"property_id": str(prop.id), "count": len(created)},
    )
    return [_to_out(i) for i in created]


@router.get("/staff/rent-invoices", response_model=list[RentInvoiceOut], dependencies=[Depends(require_module(MODULE_KEY))])
def list_org_rent_invoices(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    invoices = (
        db.query(RentInvoice)
        .join(Unit, Unit.id == RentInvoice.unit_id)
        .options(
            joinedload(RentInvoice.unit).joinedload(Unit.property),
            joinedload(RentInvoice.tenancy).joinedload(Tenancy.tenant),
            joinedload(RentInvoice.payments),
        )
        .filter(Unit.property.has(organization_id=staff.organization_id))
        .order_by(RentInvoice.due_date.desc())
        .all()
    )
    return [_to_out(i) for i in invoices]


@router.get("/staff/rent-invoices/statement.csv", dependencies=[Depends(require_module(MODULE_KEY))])
def export_rent_statement(
    from_date: date | None = None,
    to_date: date | None = None,
    staff: StaffUser = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    """Owner financial statement: one row per invoice, with totals, filtered
    by due date. Streamed as CSV so it opens directly in any spreadsheet."""
    query = (
        db.query(RentInvoice)
        .join(Unit, Unit.id == RentInvoice.unit_id)
        .options(
            joinedload(RentInvoice.unit).joinedload(Unit.property),
            joinedload(RentInvoice.tenancy).joinedload(Tenancy.tenant),
            joinedload(RentInvoice.payments),
        )
        .filter(Unit.property.has(organization_id=staff.organization_id))
    )
    if from_date:
        query = query.filter(RentInvoice.due_date >= from_date)
    if to_date:
        query = query.filter(RentInvoice.due_date <= to_date)
    invoices = query.order_by(RentInvoice.due_date.asc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "Property", "Unit", "Tenant", "Period start", "Period end", "Due date",
        "Amount due", "Total paid", "Outstanding", "Status",
    ])
    total_due = total_paid_sum = 0.0
    for invoice in invoices:
        out = _to_out(invoice)
        total_due += out.amount_due
        total_paid_sum += out.total_paid
        writer.writerow([
            invoice.unit.property.name, invoice.unit.name, invoice.tenancy.tenant.full_name,
            out.period_start, out.period_end, out.due_date,
            f"{out.amount_due:.2f}", f"{out.total_paid:.2f}", f"{out.amount_due - out.total_paid:.2f}", out.status,
        ])
    writer.writerow([])
    writer.writerow(["", "", "", "", "", "Totals", f"{total_due:.2f}", f"{total_paid_sum:.2f}", f"{total_due - total_paid_sum:.2f}", ""])

    buffer.seek(0)
    filename = f"rent-statement-{from_date or 'all'}-to-{to_date or 'all'}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/staff/rent-invoices/{invoice_id}/payments", response_model=RentInvoiceOut, dependencies=[Depends(require_module(MODULE_KEY))]
)
def record_rent_payment(invoice_id: str, payload: RentPaymentCreate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    invoice = db.get(RentInvoice, invoice_id)
    if invoice is None or invoice.unit.property.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")

    payment = RentPayment(
        invoice_id=invoice.id, amount=payload.amount, method=payload.method, paid_at=payload.paid_at,
        notes=payload.notes, recorded_by=staff.id,
    )
    db.add(payment)
    db.commit()
    db.refresh(invoice)
    record_audit(
        db, "staff", "rent_payment.recorded", organization_id=staff.organization_id, actor_id=staff.id,
        meta={"invoice_id": str(invoice.id), "amount": payload.amount},
    )
    return _to_out(invoice)


@router.get(
    "/tenant/rent-invoices", response_model=list[RentInvoiceOut], dependencies=[Depends(require_module_for_tenant(MODULE_KEY))]
)
def list_my_rent_invoices(tenancy: Tenancy = Depends(get_current_tenancy), db: Session = Depends(get_db)):
    invoices = (
        db.query(RentInvoice)
        .options(
            joinedload(RentInvoice.unit).joinedload(Unit.property),
            joinedload(RentInvoice.tenancy).joinedload(Tenancy.tenant),
            joinedload(RentInvoice.payments),
        )
        .filter(RentInvoice.unit_id == tenancy.unit_id)
        .order_by(RentInvoice.due_date.desc())
        .all()
    )
    return [_to_out(i) for i in invoices]
