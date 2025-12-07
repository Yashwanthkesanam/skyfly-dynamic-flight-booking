import sys
import os

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.api.v1.feeds import simulate_feed

def main():
    print("Starting database population...")
    db = SessionLocal()
    try:
        flights = simulate_feed(count=200, insert=True, db=db)
        print(f"Successfully inserted {len(flights)} flights.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
