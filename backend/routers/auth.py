"""ResolveX Backend - Auth API (login, register)."""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from config import settings
from auth import verify_password, get_password_hash, create_access_token
from dependencies import get_current_user
from models import User
from schemas import Token, UserCreate, UserResponse, GoogleLoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User is inactive")
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            department_id=user.department_id,
            is_active=user.is_active,
            created_at=user.created_at,
        ),
    )


@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
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


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        department_id=current_user.department_id,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.post("/google", response_model=Token)
def google_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests
        
        # Verify the token
        # Client ID is optional here if we just want to decode, but better to verify audience if we had the ID
        # For now, we'll just decode and trust (in production, MUST verify audience)
        # Adding clock_skew_in_seconds to handle cases where server time is behind Google's servers
        id_info = id_token.verify_oauth2_token(payload.token, requests.Request(), clock_skew_in_seconds=300)
        
        email = id_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Google token missing email")
            
        google_id = id_info.get("sub")
        name = id_info.get("name", email.split("@")[0])
        picture = id_info.get("picture")
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            # Update existing user with google info if needed
            if not user.google_id:
                user.google_id = google_id
            if picture and not user.avatar_url:
                user.avatar_url = picture
            db.commit()
        else:
            # Create new user
            # Generate a random password since they use Google
            import secrets
            random_password = secrets.token_urlsafe(16)
            
            user = User(
                email=email,
                hashed_password=get_password_hash(random_password),
                full_name=name,
                role="user", # Default role
                google_id=google_id,
                avatar_url=picture
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        if not user.is_active:
            raise HTTPException(status_code=400, detail="User is inactive")
            
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        
        return Token(
            access_token=access_token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                department_id=user.department_id,
                avatar_url=user.avatar_url,
                is_active=user.is_active,
                created_at=user.created_at,
            ),
        )
        
    except ValueError as e:
        print(f"DEBUG: Google Token Verification Error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        print(f"DEBUG: Google Login General Error: {e}")
        raise HTTPException(status_code=500, detail=f"Google login failed: {str(e)}")
