from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff, require_owner, require_owner_or_manager
from app.core.security import hash_password
from app.db.session import get_db
from app.models.staff_user import StaffRole, StaffUser
from app.schemas.staff import StaffInviteIn, StaffMemberOut, StaffResetPasswordIn
from app.services.audit import record_audit

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=list[StaffMemberOut], dependencies=[Depends(require_owner_or_manager)])
def list_staff(staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    return (
        db.query(StaffUser)
        .filter(StaffUser.organization_id == staff.organization_id)
        .order_by(StaffUser.created_at.asc())
        .all()
    )


@router.post("", response_model=StaffMemberOut, dependencies=[Depends(require_owner)])
def invite_staff(payload: StaffInviteIn, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    if db.query(StaffUser).filter(StaffUser.email == payload.email.lower()).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "That email is already in use")

    member = StaffUser(
        organization_id=staff.organization_id,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=StaffRole.MANAGER,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    record_audit(
        db, "staff", "staff.invited", organization_id=staff.organization_id, actor_id=staff.id,
        meta={"invited_email": member.email},
    )
    return member


def _get_manageable_member(db: Session, staff: StaffUser, member_id: str) -> StaffUser:
    member = db.get(StaffUser, member_id)
    if member is None or member.organization_id != staff.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team member not found")
    if member.id == staff.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You can't change your own access here")
    if member.role == StaffRole.OWNER:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The account owner can't be managed here")
    return member


@router.post("/{member_id}/deactivate", response_model=StaffMemberOut, dependencies=[Depends(require_owner)])
def deactivate_staff(member_id: str, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    member = _get_manageable_member(db, staff, member_id)
    member.is_active = False
    db.commit()
    db.refresh(member)
    record_audit(db, "staff", "staff.deactivated", organization_id=staff.organization_id, actor_id=staff.id, meta={"member_id": str(member.id)})
    return member


@router.post("/{member_id}/reactivate", response_model=StaffMemberOut, dependencies=[Depends(require_owner)])
def reactivate_staff(member_id: str, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    member = _get_manageable_member(db, staff, member_id)
    member.is_active = True
    db.commit()
    db.refresh(member)
    record_audit(db, "staff", "staff.reactivated", organization_id=staff.organization_id, actor_id=staff.id, meta={"member_id": str(member.id)})
    return member


@router.post("/{member_id}/reset-password", response_model=StaffMemberOut, dependencies=[Depends(require_owner)])
def reset_staff_password(
    member_id: str, payload: StaffResetPasswordIn, staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)
):
    member = _get_manageable_member(db, staff, member_id)
    member.hashed_password = hash_password(payload.password)
    member.failed_login_attempts = 0
    member.locked_until = None
    db.commit()
    db.refresh(member)
    record_audit(db, "staff", "staff.password_reset", organization_id=staff.organization_id, actor_id=staff.id, meta={"member_id": str(member.id)})
    return member
