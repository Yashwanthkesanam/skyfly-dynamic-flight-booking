import sys
import os
import random
from datetime import datetime, timedelta
import traceback

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.db.models import Flight

def main():
    print("Starting direct database population...")
    db = SessionLocal()
    
    origins = ['Hyderabad','Bengaluru','Mumbai','Delhi','Chennai','Kolkata']
    airlines = ['AirIndia','IndiGo','SpiceJet','Vistara']
    
    start_date = datetime(2025, 12, 10)
    end_date = datetime(2026, 2, 28)
    delta_days = (end_date - start_date).days
    
    count = 200
    added = 0
    
    try:
        for i in range(count):
            origin = random.choice(origins)
            dest = random.choice([d for d in origins if d != origin])
            
            random_days = random.randint(0, delta_days)
            dep_dt = (start_date + timedelta(days=random_days)).replace(hour=random.randint(0,23), minute=random.choice([0,15,30,45]), second=0, microsecond=0)
            
            duration = random.choice([60,75,90,120,150])
            arr_dt = dep_dt + timedelta(minutes=duration)
            price = round(random.uniform(2000,7000), 2)
            
            # Ensure unique flight number per day? 
            # Or just unique flight number generally if schema enforces it?
            # Creating unique flight number:
            flight_number = f"{random.choice(['AI','6E','SG','UK'])}{random.randint(1000,9999)}"
            
            flight_date = dep_dt.strftime("%Y-%m-%d")
            
            f = Flight(
                flight_number = flight_number,
                airline = random.choice(airlines),
                origin = origin,
                destination = dest,
                departure_iso = dep_dt.isoformat(),
                arrival_iso = arr_dt.isoformat(),
                duration_min = duration,
                price_real = price,
                base_price = price,
                seats_total = 180,
                seats_available = random.randint(20,180),
                flight_date = flight_date
            )
            db.add(f)
            added += 1
            
        db.commit()
        print(f"Successfully committed {added} flights.")
        
    except Exception as e:
        print("Error during insertion:")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
