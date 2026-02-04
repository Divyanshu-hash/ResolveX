"""ResolveX Backend - Analytics API (SQL-driven metrics)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from database import get_db
from dependencies import get_current_user, RequireAdmin
from models import User, Complaint, Assignment, Category, Feedback
from schemas import AnalyticsSummary
from services.ai_service import AIService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    # Total / open / resolved / escalated
    total = db.query(func.count(Complaint.id)).scalar() or 0
    open_statuses = ["submitted", "categorized", "assigned", "in_progress"]
    open_count = db.query(func.count(Complaint.id)).filter(Complaint.status.in_(open_statuses)).scalar() or 0
    resolved_count = db.query(func.count(Complaint.id)).filter(Complaint.status.in_(["resolved", "closed"])).scalar() or 0
    escalated_count = db.query(func.count(Complaint.id)).filter(Complaint.is_escalated == True).scalar() or 0

    # Avg resolution time (hours) - SQL
    avg_hours = db.execute(
        text("""
            SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) AS avg_hours
            FROM complaints
            WHERE resolved_at IS NOT NULL
        """)
    ).scalar()
    avg_resolution_hours = float(avg_hours) if avg_hours is not None else None

    # By category - SQL
    by_category = db.execute(
        text("""
            SELECT COALESCE(c.name, 'Uncategorized') AS name, COUNT(co.id) AS count
            FROM complaints co
            LEFT JOIN categories c ON co.category_id = c.id
            GROUP BY co.category_id, c.name
            ORDER BY count DESC
        """)
    ).fetchall()
    complaints_by_category = [{"name": r[0], "count": r[1]} for r in by_category]

    # By priority - SQL
    by_priority = db.execute(
        text("""
            SELECT priority AS name, COUNT(*) AS count
            FROM complaints
            GROUP BY priority
            ORDER BY FIELD(priority, 'critical', 'high', 'medium', 'low')
        """)
    ).fetchall()
    complaints_by_priority = [{"name": r[0], "count": r[1]} for r in by_priority]

    # By month - SQL
    by_month = db.execute(
        text("""
            SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
            FROM complaints
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month
        """)
    ).fetchall()
    complaints_by_month = [{"month": r[0], "count": r[1]} for r in by_month]

    # Staff performance - resolved count per staff
    staff_perf = db.execute(
        text("""
            SELECT u.id, u.full_name, COUNT(c.id) AS resolved_count
            FROM users u
            LEFT JOIN assignments a ON a.staff_id = u.id
            LEFT JOIN complaints c ON c.id = a.complaint_id AND c.status IN ('resolved', 'closed')
            WHERE u.role IN ('staff', 'admin')
            GROUP BY u.id, u.full_name
            ORDER BY resolved_count DESC
        """)
    ).fetchall()
    staff_performance = [{"staff_id": r[0], "staff_name": r[1], "resolved_count": r[2] or 0} for r in staff_perf]

    return AnalyticsSummary(
        total_complaints=total,
        open_complaints=open_count,
        resolved_complaints=resolved_count,
        escalated_complaints=escalated_count,
        avg_resolution_hours=avg_resolution_hours,
        complaints_by_category=complaints_by_category,
        complaints_by_priority=complaints_by_priority,
        complaints_by_month=complaints_by_month,
        staff_performance=staff_performance,
    )


@router.get("/insights", response_model=str)
def get_dashboard_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    # Reuse the summary logic
    summary = get_analytics_summary(db, current_user)
    
    # Convert Pydantic model to dict
    summary_dict = summary.model_dump()
    
    # Generate insights
    ai_service = AIService()
    return ai_service.generate_dashboard_insights(summary_dict)
