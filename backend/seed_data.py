import json
from database import SessionLocal
from models import Department, Category


def seed_departments(db):
    departments = [
        "Maintenance",
        "IT",
        "Security",
        "Admin",
    ]

    for name in departments:
        exists = db.query(Department).filter_by(name=name).first()
        if not exists:
            db.add(Department(name=name))

    db.commit()


def seed_categories(db):
    categories = [
        {
            "name": "Water",
            "keywords": ["water", "leak", "pipe", "tap", "pressure"],
            "priority": "medium",
        },
        {
            "name": "Electricity",
            "keywords": ["electric", "power", "shock", "voltage", "switch"],
            "priority": "high",
        },
        {
            "name": "Internet/Network",
            "keywords": ["wifi", "internet", "slow", "connect"],
            "priority": "medium",
        },
        {
            "name": "Cleaning",
            "keywords": ["clean", "dirt", "garbage", "trash"],
            "priority": "low",
        },
        {
            "name": "Security",
            "keywords": ["theft", "lost", "guard", "access"],
            "priority": "high",
        },
    ]

    for c in categories:
        exists = db.query(Category).filter_by(name=c["name"]).first()
        if not exists:
            db.add(
                Category(
                    name=c["name"],
                    keywords=json.dumps(c["keywords"]),
                    default_priority=c["priority"],
                )
            )

    db.commit()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_departments(db)
        seed_categories(db)
        print("✅ Seed data inserted successfully")
    finally:
        db.close()
