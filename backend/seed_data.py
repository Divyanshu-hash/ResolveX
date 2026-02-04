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
            "name": "Water & Plumbing",
            "keywords": [
                "water", "leak", "leakage", "pipe", "tap", "flush",
                "toilet", "washroom", "bathroom", "geyser",
                "no water", "low pressure", "overflow", "drain"
            ],
            "priority": "medium",
        },
        {
            "name": "Electricity",
            "keywords": [
                "electric", "electricity", "power", "no power",
                "switch", "socket", "plug", "short circuit",
                "shock", "sparks", "voltage", "light", "fan"
            ],
            "priority": "high",
        },
        {
            "name": "Internet / Network",
            "keywords": [
                "wifi", "internet", "network", "slow internet",
                "no internet", "router", "connection", "lan"
            ],
            "priority": "medium",
        },
        {
            "name": "Cleaning & Hygiene",
            "keywords": [
                "clean", "cleaning", "dirty", "garbage", "trash",
                "smell", "odor", "toilet dirty", "washroom dirty",
                "mosquito", "insects", "rats"
            ],
            "priority": "low",
        },
        {
            "name": "Security & Safety",
            "keywords": [
                "theft", "stolen", "lost", "security",
                "unauthorized", "intruder", "fight",
                "gate", "guard", "unsafe", "lock broken"
            ],
            "priority": "high",
        },
        {
            "name": "Room & Furniture",
            "keywords": [
                "bed", "chair", "table", "cupboard",
                "locker", "broken bed", "mattress",
                "window", "door", "lock", "curtain"
            ],
            "priority": "low",
        },
        {
            "name": "AC / Ventilation",
            "keywords": [
                "ac", "air conditioner", "cooling",
                "not cooling", "fan not working",
                "ventilation", "hot room"
            ],
            "priority": "medium",
        },
        {
            "name": "Food & Mess",
            "keywords": [
                "food", "mess", "canteen",
                "bad food", "quality", "stale",
                "raw food", "hygiene", "food poisoning"
            ],
            "priority": "medium",
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
