from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_staff, get_current_tenancy, require_module, require_module_for_tenant
from app.db.session import get_db
from app.models.complaint import Complaint
from app.models.staff_user import StaffUser
from app.models.tenancy import Tenancy
from app.models.unit import Unit
from app.schemas.complaint import ComplaintCreate, ComplaintOut, ComplaintUpdate

router = APIRouter(tags=["complaints"])

MODULE_KEY = "complaints"


def _to_out(c: Complaint) -> ComplaintOut:
    out = ComplaintOut.model_validate(c)
    out.tenant_name = c.tenancy.tenant.full_name
    out.unit_name = c.tenancy.unit.name
    return out


@router.post(
    "/tenant/complaints", response_model=ComplaintOut, dependencies=[Depends(require_module_for_tenant(MODULE_KEY))]
)
def create_complaint(payload: ComplaintCreate, tenancy: Tenancy = Depends(get_current_tenancy), db: Session = Depends(get_db)):
    complaint = Complaint(tenancy_id=tenancy.id, subject=payload.subject, description=payload.description, priority=payload.priority)
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return _to_out(complaint)


@router.get(
    "/tenant/complaints", response_model=list[ComplaintOut], dependencies=[Depends(require_module_for_tenant(MODULE_KEY))]
)
def list_my_complaints(tenancy: Tenancy = Depends(get_current_tenancy), db: Session = Depends(get_db)):
    complaints = db.query(Complaint).filter(Complaint.tenancy_id == tenancy.id).order_by(Complaint.created_at.desc()).all()
    return [_to_out(c) for c in complaints]


@router.get(
    "/staff/complaints", response_model=list[ComplaintOut], dependencies=[Depends(require_module(MODULE_KEY))]
)
def list_org_complaints(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    complaints = (
        db.query(Complaint)
        .join(Complaint.tenancy)
        .options(joinedload(Complaint.tenancy).joinedload(Tenancy.tenant), joinedload(Complaint.tenancy).joinedload(Tenancy.unit))
        .filter(Tenancy.unit.has(Unit.property.has(organization_id=staff.organization_id)))
        .order_by(Complaint.created_at.desc())
        .all()
    )
    return [_to_out(c) for c in complaints]


@router.patch(
    "/staff/complaints/{complaint_id}", response_model=ComplaintOut, dependencies=[Depends(require_module(MODULE_KEY))]
)
def update_complaint(complaint_id: str, payload: ComplaintUpdate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    complaint = db.get(Complaint, complaint_id)
    if complaint is None or complaint.tenancy.unit.property.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found")
    complaint.status = payload.status
    db.commit()
    db.refresh(complaint)
    return _to_out(complaint)
