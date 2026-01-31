"""ResolveX Backend - Evidence upload API."""
import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from config import settings
from dependencies import get_current_user, RequireUser
from models import User, Complaint, EvidenceUpload

router = APIRouter(prefix="/evidence", tags=["evidence"])

ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_DOC = {"application/pdf"}
ALLOWED = ALLOWED_IMAGE | ALLOWED_DOC
MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.post("/{complaint_id}")
async def upload_evidence(
    complaint_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireUser),
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    if current_user.role == "user" and c.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
    if not file.content_type or file.content_type not in ALLOWED:
        raise HTTPException(400, "Only JPG, PNG, GIF, WebP and PDF allowed")
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(400, f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB} MB")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "bin")[1] or ".bin"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, safe_name)
    async with aiofiles.open(path, "wb") as f:
        await f.write(content)
    rec = EvidenceUpload(
        complaint_id=complaint_id,
        file_name=file.filename or safe_name,
        file_path=path,
        file_type=file.content_type,
        file_size=len(content),
        uploaded_by=current_user.id,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"id": rec.id, "file_name": rec.file_name, "file_type": rec.file_type, "created_at": str(rec.created_at)}


@router.get("/{complaint_id}")
def list_evidence(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireUser),
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    if current_user.role == "user" and c.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
    if current_user.role == "staff" and c.assignment and c.assignment.staff_id != current_user.id:
        raise HTTPException(403, "Access denied")
    rows = db.query(EvidenceUpload).filter(EvidenceUpload.complaint_id == complaint_id).all()
    return [
        {"id": r.id, "file_name": r.file_name, "file_type": r.file_type, "file_size": r.file_size, "created_at": str(r.created_at)}
        for r in rows
    ]


@router.get("/file/{evidence_id}")
def download_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireUser),
):
    rec = db.query(EvidenceUpload).filter(EvidenceUpload.id == evidence_id).first()
    if not rec:
        raise HTTPException(404, "Evidence not found")
    c = rec.complaint
    if current_user.role == "user" and c.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
    if current_user.role == "staff" and c.assignment and c.assignment.staff_id != current_user.id:
        raise HTTPException(403, "Access denied")
    if not os.path.isfile(rec.file_path):
        raise HTTPException(404, "File not found on server")
    return FileResponse(rec.file_path, filename=rec.file_name, media_type=rec.file_type)
