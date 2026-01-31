"""ResolveX Backend - Complaints API."""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from database import get_db
from config import settings
from dependencies import get_current_user, RequireUser, RequireStaff, RequireAdmin
from models import User, Complaint, ComplaintLog, Assignment, Category
from schemas import (
    ComplaintCreate,
    ComplaintUpdate,
    ComplaintAssign,
    ComplaintResponse,
    ComplaintLogResponse,
)
from services.categorization import categorize_complaint
from services.complaint_log import add_log

router = APIRouter(prefix="/complaints", tags=["complaints"])


def _complaint_to_response(db: Session, c: Complaint) -> ComplaintResponse:
    user_name = c.user.full_name if c.user else None
    category_name = c.category.name if c.category else None
    assigned_staff_name = None
    if c.assignment and c.assignment.staff:
        assigned_staff_name = c.assignment.staff.full_name
    return ComplaintResponse(
        id=c.id,
        user_id=c.user_id,
        title=c.title,
        description=c.description,
        category_id=c.category_id,
        priority=c.priority,
        status=c.status,
        location=c.location,
        is_escalated=c.is_escalated,
        escalated_at=c.escalated_at,
        due_date=c.due_date,
        resolved_at=c.resolved_at,
        closed_at=c.closed_at,
        created_at=c.created_at,
        updated_at=c.updated_at,
        user_name=user_name,
        category_name=category_name,
        assigned_staff_name=assigned_staff_name,
    )


@router.post("", response_model=ComplaintResponse)
def create_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireUser),
):
    complaint = Complaint(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        category_id=data.category_id,
        location=data.location,
        status="submitted",
        sla_days=settings.SLA_DAYS,
        due_date=datetime.utcnow() + timedelta(days=settings.SLA_DAYS),
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    categorize_complaint(db, complaint)
    add_log(db, complaint.id, current_user.id, "created", None, "submitted", "Complaint submitted")
    return _complaint_to_response(db, complaint)


@router.get("", response_model=list[ComplaintResponse])
def list_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireUser),
):
    q = db.query(Complaint).join(User)
    if current_user.role == "user":
        q = q.filter(Complaint.user_id == current_user.id)
    elif current_user.role == "staff":
        q = q.outerjoin(Assignment, Assignment.complaint_id == Complaint.id).filter(
            (Assignment.staff_id == current_user.id) | (Complaint.user_id == current_user.id)
        )
    if status_filter:
        q = q.filter(Complaint.status == status_filter)
    if priority_filter:
        q = q.filter(Complaint.priority == priority_filter)
    complaints = q.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return [_complaint_to_response(db, c) for c in complaints]


@router.get("/all", response_model=list[ComplaintResponse])
def list_all_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    q = db.query(Complaint)
    if status_filter:
        q = q.filter(Complaint.status == status_filter)
    complaints = q.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return [_complaint_to_response(db, c) for c in complaints]


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireUser),
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    if current_user.role == "user" and c.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
    if current_user.role == "staff" and c.assignment and c.assignment.staff_id != current_user.id and c.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
    return _complaint_to_response(db, c)


@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    data: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireStaff),
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    if current_user.role == "staff" and (not c.assignment or c.assignment.staff_id != current_user.id):
        raise HTTPException(403, "Not assigned to this complaint")
    if data.status is not None:
        add_log(db, complaint_id, current_user.id, "status_change", c.status, data.status, None)
        c.status = data.status
        if data.status == "resolved":
            c.resolved_at = datetime.utcnow()
        elif data.status == "closed":
            c.closed_at = datetime.utcnow()
    if data.priority is not None:
        add_log(db, complaint_id, current_user.id, "priority_change", c.priority, data.priority, None)
        c.priority = data.priority
    if data.title is not None:
        c.title = data.title
    if data.description is not None:
        c.description = data.description
    if data.category_id is not None:
        c.category_id = data.category_id
    if data.location is not None:
        c.location = data.location
    db.commit()
    db.refresh(c)
    return _complaint_to_response(db, c)


@router.post("/{complaint_id}/assign", response_model=ComplaintResponse)
def assign_complaint(
    complaint_id: int,
    data: ComplaintAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    staff = db.query(User).filter(User.id == data.staff_id, User.role.in_(["staff", "admin"])).first()
    if not staff:
        raise HTTPException(400, "Invalid staff")
    existing = db.query(Assignment).filter(Assignment.complaint_id == complaint_id).first()
    if existing:
        existing.staff_id = data.staff_id
        existing.assigned_by = current_user.id
        existing.notes = data.notes
    else:
        a = Assignment(complaint_id=complaint_id, staff_id=data.staff_id, assigned_by=current_user.id, notes=data.notes)
        db.add(a)
    add_log(db, complaint_id, current_user.id, "assigned", None, staff.full_name, data.notes)
    c.status = "assigned"
    db.commit()
    db.refresh(c)
    return _complaint_to_response(db, c)


@router.get("/{complaint_id}/logs", response_model=list[ComplaintLogResponse])
def get_complaint_logs(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireUser),
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    if current_user.role == "user" and c.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
    logs = db.query(ComplaintLog).filter(ComplaintLog.complaint_id == complaint_id).order_by(ComplaintLog.created_at).all()
    return [
        ComplaintLogResponse(
            id=l.id,
            complaint_id=l.complaint_id,
            user_id=l.user_id,
            action=l.action,
            old_value=l.old_value,
            new_value=l.new_value,
            message=l.message,
            created_at=l.created_at,
            user_name=l.user.full_name if l.user else "System",
        )
        for l in logs
    ]
