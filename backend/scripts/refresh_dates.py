
import sys
import os
from datetime import datetime, timedelta

# Add backend directory to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.base import SessionLocal
from app.db.models import Flight, DemandScore, Booking

def refresh_dates():
    db = SessionLocal()
    try:
        flights = db.query(Flight).all()
        if not flights:
            print("No flights found.")
            return

        # Find earliest date
        # Check both departure_iso and date
        dates = []
        for f in flights:
            if f.departure_iso:
                dates.append(datetime.fromisoformat(f.departure_iso.replace("Z", "")))
            elif f.flight_date:
                dates.append(datetime.strptime(f.flight_date, "%Y-%m-%d"))
        
        if not dates:
            print("No valid dates found.")
            return
            
        min_date = min(dates)
        now = datetime.now()
        
        # Calculate shift needed to bring min_date to today
        # We want min_date to be today + 1 hour (so it's upcoming)
        target_start = now + timedelta(hours=1)
        shift = target_start - min_date
        
        print(f"Shifting dates by {shift}. Old Start: {min_date}, New Start: {target_start}")
        
        count = 0
        for f in flights:
            if f.departure_iso:
                dt = datetime.fromisoformat(f.departure_iso.replace("Z", ""))
                new_dt = dt + shift
                f.departure_iso = new_dt.isoformat()
                f.flight_date = new_dt.strftime("%Y-%m-%d")  # Correct field name
                # f.departure_time = ... (doesn't exist in model, unused)
                
                if f.arrival_iso:
                     try:
                        arr = datetime.fromisoformat(f.arrival_iso.replace("Z", ""))
                        f.arrival_iso = (arr + shift).isoformat()
                     except:
                        pass
                
                count += 1
                
        db.commit()
        print(f"Successfully shifted {count} flights to present/future.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    refresh_dates()
