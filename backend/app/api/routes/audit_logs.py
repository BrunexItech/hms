from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff, require_owner, require_super_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.staff_user import StaffUser
from app.schemas.audit_log import AuditLogOut

router = APIRouter(tags=["audit-logs"])


@router.get("/organizations/{org_id}/audit-logs", response_model=list[AuditLogOut], dependencies=[Depends(require_super_admin)])
def list_org_audit_logs(org_id: str, limit: int = Query(100, le=500), db: Session = Depends(get_db)):
    return (
        db.query(AuditLog)
        .filter(AuditLog.organization_id == org_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/audit-logs/me", response_model=list[AuditLogOut], dependencies=[Depends(require_owner)])
def list_my_audit_logs(limit: int = Query(100, le=500), staff: StaffUser = Depends(get_current_staff), db: Session = Depends(get_db)):
    return (
        db.query(AuditLog)
        .filter(AuditLog.organization_id == staff.organization_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
