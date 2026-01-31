"""ResolveX Backend - SQLAlchemy ORM models."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Enum, ForeignKey, DateTime, TIMESTAMP
from sqlalchemy.orm import relationship
from database import Base


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(Enum("user", "staff", "admin", "super_admin"), default="user", nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department")
    complaints = relationship("Complaint", back_populates="user", foreign_keys="Complaint.user_id")
    assignments = relationship("Assignment", back_populates="staff", foreign_keys="Assignment.staff_id")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    keywords = Column(Text)  # JSON array
    default_priority = Column(Enum("low", "medium", "high", "critical"), default="medium")
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    priority = Column(Enum("low", "medium", "high", "critical"), default="medium", nullable=False)
    status = Column(
        Enum("submitted", "categorized", "assigned", "in_progress", "resolved", "closed"),
        default="submitted",
        nullable=False,
    )
    location = Column(String(255))
    is_escalated = Column(Boolean, default=False)
    escalated_at = Column(TIMESTAMP)
    escalation_reason = Column(Text)
    sla_days = Column(Integer, default=3)
    due_date = Column(TIMESTAMP)
    resolved_at = Column(TIMESTAMP)
    closed_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="complaints", foreign_keys=[user_id])
    category = relationship("Category")
    logs = relationship("ComplaintLog", back_populates="complaint", order_by="ComplaintLog.created_at")
    assignment = relationship("Assignment", back_populates="complaint", uselist=False)
    evidence = relationship("EvidenceUpload", back_populates="complaint")
    feedback_rel = relationship("Feedback", back_populates="complaint", uselist=False)


class ComplaintLog(Base):
    __tablename__ = "complaint_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    action = Column(String(50), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    message = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="logs")
    user = relationship("User")


class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, unique=True)
    staff_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    assigned_at = Column(TIMESTAMP, default=datetime.utcnow)
    notes = Column(Text)

    complaint = relationship("Complaint", back_populates="assignment")
    staff = relationship("User", back_populates="assignments", foreign_keys=[staff_id])


class EvidenceUpload(Base):
    __tablename__ = "evidence_uploads"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="evidence")


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="feedback_rel")


class EscalationLog(Base):
    __tablename__ = "escalation_log"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    previous_priority = Column(String(20))
    new_priority = Column(String(20), nullable=False)
    reason = Column(Text)
    triggered_at = Column(TIMESTAMP, default=datetime.utcnow)
