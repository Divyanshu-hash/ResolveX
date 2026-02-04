"""ResolveX Backend - Smart complaint categorization and priority."""
import json
import re
from sqlalchemy.orm import Session
from models import Category, Complaint

# Fallback keyword -> priority (when no category match)
PRIORITY_KEYWORDS = {
    "high": ["electric", "electricity", "fire", "shock", "security", "theft", "safety", "emergency"],
    "medium": ["water", "leak", "cleaning", "maintenance", "repair", "broken", "damage"],
    "low": [],
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())


def _match_keyword(text: str, keyword: str) -> bool:
    return re.search(rf"\b{re.escape(keyword.lower())}\b", text) is not None


def _get_category_from_db(db: Session, description: str) -> tuple[Category | None, str]:
    """Match description against category keywords; return (category, priority)."""
    text = _normalize(description)
    categories = db.query(Category).all()
    best_match = None
    best_priority = "low"

    for cat in categories:
        if not cat.keywords:
            continue
        try:
            keywords = json.loads(cat.keywords) if isinstance(cat.keywords, str) else cat.keywords
        except (json.JSONDecodeError, TypeError):
            continue
        for kw in keywords:
            if kw.lower() in text:
                best_match = cat
                best_priority = cat.default_priority or "medium"
                break
        if best_match:
            break

    if not best_match:
        for level, kws in PRIORITY_KEYWORDS.items():
            if any(k in text for k in kws):
                best_priority = level
                break

    return best_match, best_priority



from services.ai_service import AIService

def categorize_complaint(db: Session, complaint: Complaint) -> None:
    """Auto-assign category and priority from description; update complaint."""
    # Try AI prediction first
    ai_service = AIService()
    ai_result = ai_service.predict_category_and_urgency(complaint.title, complaint.description)
    
    category = None
    priority = "medium"

    if ai_result:
        # Try to find the AI-predicted category in DB
        category_name = ai_result.get("category")
        priority = ai_result.get("priority", "medium")
        if category_name:
            category = db.query(Category).filter(Category.name.ilike(category_name)).first()
    
    # Fallback to keyword matching if AI failed or category not found
    if not category:
         cat_match, prio_match = _get_category_from_db(db, complaint.description)
         category = cat_match
         # If AI gave a priority but no category, keep AI priority, else use keyword priority
         if not ai_result:
             priority = prio_match

    old_status = complaint.status
    complaint.priority = priority
    if category:
        complaint.category_id = category.id
        complaint.status = "categorized"
    else:
        complaint.status = "submitted"
    db.commit()
    db.refresh(complaint)
