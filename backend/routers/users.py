"""ResolveX Backend - Users API (admin: list staff/admins)."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user, RequireAdmin, RequireSuperAdmin
from models import User
from schemas import UserResponse, UserCreate
from auth import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    role: str | None = Query(None, description="Filter by role"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    q = db.query(User).filter(User.is_active == True)
    if current_user.role == "admin":
        q = q.filter(User.role.in_(["user", "staff"]))
    if role:
        q = q.filter(User.role == role)
    users = q.order_by(User.full_name).all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            department_id=u.department_id,
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/staff", response_model=list[UserResponse])
def list_staff(
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    users = db.query(User).filter(User.role.in_(["staff", "admin"]), User.is_active == True).order_by(User.full_name).all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            department_id=u.department_id,
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.post("", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireSuperAdmin),
):
    if db.query(User).filter(User.email == data.email).first():
        from fastapi import HTTPException
        raise HTTPException(400, "Email already registered")
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role,
        department_id=data.department_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        department_id=user.department_id,
        is_active=user.is_active,
        created_at=user.created_at,
    )
