import sys
import os

# Add parent dir to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal
from app.db.models import Flight

def count_flights():
    db = SessionLocal()
    try:
        count = db.query(Flight).count()
        print(f"✅ Total flights in database: {count}")
        
        if count > 0:
            first = db.query(Flight).first()
            print(f"   Sample Flight: {first.flight_number} ({first.origin} -> {first.destination})")
            print(f"   Date: {first.flight_date}")
        else:
            print("❌ Database is EMPTY!")
            print(f"   DB Path: {db.bind.url}")
            
    finally:
        db.close()

if __name__ == "__main__":
    count_flights()
