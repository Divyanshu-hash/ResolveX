"""ResolveX Backend - Feedback API (after resolution)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user, RequireUser
from models import User, Complaint, Feedback
from schemas import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("/{complaint_id}", response_model=FeedbackResponse)
def submit_feedback(
    complaint_id: int,
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireUser),
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    if c.user_id != current_user.id:
        raise HTTPException(403, "Only complaint creator can submit feedback")
    if c.status not in ("resolved", "closed"):
        raise HTTPException(400, "Complaint must be resolved or closed to give feedback")
    existing = db.query(Feedback).filter(Feedback.complaint_id == complaint_id).first()
    if existing:
        raise HTTPException(400, "Feedback already submitted")
    f = Feedback(complaint_id=complaint_id, user_id=current_user.id, rating=data.rating, comment=data.comment)
    db.add(f)
    db.commit()
    db.refresh(f)
    return FeedbackResponse(
        id=f.id,
        complaint_id=f.complaint_id,
        user_id=f.user_id,
        rating=f.rating,
        comment=f.comment,
        created_at=f.created_at,
    )


@router.get("/{complaint_id}", response_model=FeedbackResponse | None)
def get_feedback(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireUser),
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    if current_user.role == "user" and c.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
    f = db.query(Feedback).filter(Feedback.complaint_id == complaint_id).first()
    if not f:
        return None
    return FeedbackResponse(
        id=f.id,
        complaint_id=f.complaint_id,
        user_id=f.user_id,
        rating=f.rating,
        comment=f.comment,
        created_at=f.created_at,
    )
