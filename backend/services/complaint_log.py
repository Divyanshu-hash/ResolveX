"""ResolveX Backend - Complaint timeline / audit log helper."""
from sqlalchemy.orm import Session
from models import ComplaintLog


def add_log(
    db: Session,
    complaint_id: int,
    user_id: int | None,
    action: str,
    old_value: str | None = None,
    new_value: str | None = None,
    message: str | None = None,
) -> ComplaintLog:
    log = ComplaintLog(
        complaint_id=complaint_id,
        user_id=user_id,
        action=action,
        old_value=old_value,
        new_value=new_value,
        message=message,
    )
    db.add(log)
    return log
