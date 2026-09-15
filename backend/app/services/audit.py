import uuid

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def record_audit(
    db: Session,
    actor_type: str,
    action: str,
    organization_id: uuid.UUID | None = None,
    actor_id: uuid.UUID | None = None,
    meta: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            organization_id=organization_id,
            actor_type=actor_type,
            actor_id=actor_id,
            action=action,
            meta=meta,
        )
    )
    db.commit()
