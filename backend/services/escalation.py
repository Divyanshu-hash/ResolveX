"""ResolveX Backend - Escalation detection and execution."""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from config import settings
from models import Complaint, ComplaintLog, EscalationLog
from database import SessionLocal


PRIORITY_ORDER = ["low", "medium", "high", "critical"]


def _next_priority(current: str) -> str:
    try:
        i = PRIORITY_ORDER.index(current.lower())
        return PRIORITY_ORDER[min(i + 1, len(PRIORITY_ORDER) - 1)]
    except (ValueError, AttributeError):
        return "high"


def run_escalation_job() -> None:
    """Find overdue complaints, escalate priority, log, and add complaint_log entry."""
    if not settings.ESCALATION_ENABLED:
        return
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=settings.SLA_DAYS)
        # Complaints not resolved/closed and past due (or created before cutoff)
        overdue = (
            db.query(Complaint)
            .filter(
                Complaint.status.notin_(["resolved", "closed"]),
                Complaint.is_escalated == False,
                Complaint.created_at <= cutoff,
            )
            .all()
        )
        for c in overdue:
            old_priority = c.priority
            new_priority = _next_priority(old_priority)
            c.priority = new_priority
            c.is_escalated = True
            c.escalated_at = datetime.utcnow()
            c.escalation_reason = f"Auto-escalated: SLA ({settings.SLA_DAYS} days) exceeded."

            db.add(
                EscalationLog(
                    complaint_id=c.id,
                    previous_priority=old_priority,
                    new_priority=new_priority,
                    reason=c.escalation_reason,
                )
            )
            db.add(
                ComplaintLog(
                    complaint_id=c.id,
                    user_id=None,
                    action="escalation",
                    old_value=old_priority,
                    new_value=new_priority,
                    message=c.escalation_reason,
                )
            )
        db.commit()
    finally:
        db.close()
