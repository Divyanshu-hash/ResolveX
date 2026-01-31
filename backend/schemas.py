"""ResolveX Backend - Pydantic schemas for request/response."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    department_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}




# ----- Auth -----
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=150)
    role: str = Field(default="user", pattern="^(user|staff|admin|super_admin)$")
    department_id: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str




# ----- Department -----
class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


# ----- Category -----
class CategoryResponse(BaseModel):
    id: int
    name: str
    default_priority: str
    department_id: Optional[int] = None

    class Config:
        from_attributes = True


# ----- Complaint -----
class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    category_id: Optional[int] = None
    location: Optional[str] = None


class ComplaintUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    category_id: Optional[int] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    status: Optional[str] = Field(
        None,
        pattern="^(submitted|categorized|assigned|in_progress|resolved|closed)$",
    )
    location: Optional[str] = None
    resolution_notes: Optional[str] = None


class ComplaintAssign(BaseModel):
    staff_id: int
    notes: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    category_id: Optional[int] = None
    priority: str
    status: str
    location: Optional[str] = None
    is_escalated: bool
    escalated_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None
    category_name: Optional[str] = None
    assigned_staff_name: Optional[str] = None

    class Config:
        from_attributes = True


# ----- Complaint Log / Timeline -----
class ComplaintLogResponse(BaseModel):
    id: int
    complaint_id: int
    user_id: Optional[int] = None
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


# ----- Evidence -----
class EvidenceUploadResponse(BaseModel):
    id: int
    complaint_id: int
    file_name: str
    file_path: str
    file_type: str
    file_size: Optional[int] = None
    uploaded_by: int
    created_at: datetime

    class Config:
        from_attributes = True


# ----- Feedback -----
class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    complaint_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ----- Analytics -----
class AnalyticsSummary(BaseModel):
    total_complaints: int
    open_complaints: int
    resolved_complaints: int
    escalated_complaints: int
    avg_resolution_hours: Optional[float] = None
    complaints_by_category: List[dict]
    complaints_by_priority: List[dict]
    complaints_by_month: List[dict]
    staff_performance: List[dict]
