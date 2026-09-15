from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff, require_owner_or_manager, require_super_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.module import Module, OrganizationModule
from app.models.organization import Organization
from app.models.staff_user import StaffRole, StaffUser
from app.schemas.organization import OrganizationCreate, OrganizationOut, OrganizationUpdate
from app.services.audit import record_audit

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/me", response_model=OrganizationOut)
def get_my_organization(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    if staff.organization_id is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not part of an organization")
    org = db.get(Organization, staff.organization_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    return org


@router.patch("/me", response_model=OrganizationOut, dependencies=[Depends(require_owner_or_manager)])
def update_my_organization(payload: OrganizationUpdate, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    org = db.get(Organization, staff.organization_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(org, field, value)
    db.commit()
    db.refresh(org)
    record_audit(db, "staff", "organization.branding_updated", organization_id=org.id, actor_id=staff.id)
    return org


@router.post("", response_model=OrganizationOut, dependencies=[Depends(require_super_admin)])
def create_organization(payload: OrganizationCreate, db: Session = Depends(get_db)):
    if db.query(Organization).filter(Organization.slug == payload.slug).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "That slug is already taken")
    if db.query(StaffUser).filter(StaffUser.email == payload.owner_email.lower()).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "That owner email is already in use")

    org = Organization(name=payload.name, slug=payload.slug, primary_color=payload.primary_color)
    db.add(org)
    db.flush()

    owner = StaffUser(
        organization_id=org.id,
        email=payload.owner_email.lower(),
        hashed_password=hash_password(payload.owner_password),
        full_name=payload.owner_full_name,
        role=StaffRole.OWNER,
    )
    db.add(owner)

    for module in db.query(Module).all():
        db.add(OrganizationModule(organization_id=org.id, module_id=module.id, enabled=True))

    db.commit()
    db.refresh(org)
    record_audit(db, "super_admin", "organization.created", organization_id=org.id, meta={"slug": org.slug})
    return org


@router.get("", response_model=list[OrganizationOut], dependencies=[Depends(require_super_admin)])
def list_organizations(db: Session = Depends(get_db)):
    return db.query(Organization).order_by(Organization.created_at.desc()).all()


@router.get("/{org_id}", response_model=OrganizationOut, dependencies=[Depends(require_super_admin)])
def get_organization(org_id: str, db: Session = Depends(get_db)):
    org = db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    return org


@router.patch("/{org_id}", response_model=OrganizationOut, dependencies=[Depends(require_super_admin)])
def update_organization(org_id: str, payload: OrganizationUpdate, db: Session = Depends(get_db)):
    org = db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(org, field, value)
    db.commit()
    db.refresh(org)
    return org


@router.post("/{org_id}/suspend", response_model=OrganizationOut, dependencies=[Depends(require_super_admin)])
def suspend_organization(org_id: str, db: Session = Depends(get_db)):
    org = db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    org.is_active = False
    db.commit()
    record_audit(db, "super_admin", "organization.suspended", organization_id=org.id)
    return org


@router.post("/{org_id}/reactivate", response_model=OrganizationOut, dependencies=[Depends(require_super_admin)])
def reactivate_organization(org_id: str, db: Session = Depends(get_db)):
    org = db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    org.is_active = True
    db.commit()
    record_audit(db, "super_admin", "organization.reactivated", organization_id=org.id)
    return org
