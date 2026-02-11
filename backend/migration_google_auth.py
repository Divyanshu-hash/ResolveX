import sys
import os
from sqlalchemy import create_engine, text
from config import settings

# Ensure we use the correct driver
db_url = settings.DATABASE_URL
if "mysql+pymysql" not in db_url and "mysql" in db_url:
    db_url = db_url.replace("mysql://", "mysql+pymysql://")

print(f"Connecting to database (Driver: {db_url.split('://')[0]})...")

try:
    engine = create_engine(db_url)
    
    with engine.connect() as connection:
        # Check if columns exist
        print("Checking for existing columns...")
        
        # Check google_id
        try:
            result = connection.execute(text("SELECT google_id FROM users LIMIT 1"))
            print("Column 'google_id' already exists. Skipping.")
        except Exception:
            print("Adding 'google_id' column...")
            connection.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE DEFAULT NULL"))
            print("Added 'google_id'.")

        # Check avatar_url
        try:
            result = connection.execute(text("SELECT avatar_url FROM users LIMIT 1"))
            print("Column 'avatar_url' already exists. Skipping.")
        except Exception:
            print("Adding 'avatar_url' column...")
            connection.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512) DEFAULT NULL"))
            print("Added 'avatar_url'.")
        
        connection.commit()
        print("Migration complete!")

except Exception as e:
    print(f"Migration failed: {e}")
    # Print more details if possible
    import traceback
    traceback.print_exc()
