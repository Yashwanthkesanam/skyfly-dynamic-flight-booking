
import sys
import os
import random
from datetime import datetime, timedelta
import traceback

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.db.models import Flight
import uuid

def main():
    print("Starting targeted database population (HYD -> BLR)...")
    db = SessionLocal()
    
    origin = "Hyderabad"
    msg_origin = "HYD"
    dest = "Bengaluru"
    msg_dest = "BLR"
    
    airlines = ['AirIndia','IndiGo','SpiceJet','Vistara']
    
    # Target Dates: Dec 10, 2025 onwards, mostly
    start_date = datetime(2025, 12, 10)
    
    count = 25 # At least 20
    added = 0
    
    try:
        for i in range(count):
            # Spread over a few days so they show up in searches
            delta = i % 5 # 0 to 4 days offset
            flight_dt = start_date + timedelta(days=delta)
            
            # Vary hours
            flight_dt = flight_dt.replace(hour=random.randint(5, 23), minute=random.choice([0, 15, 30, 45]), second=0)
            
            duration = 75 # typical HYD-BLR
            arr_dt = flight_dt + timedelta(minutes=duration)
            
            price = round(random.uniform(2500, 5500), 2)
            
            # Seats: 70 to 180 as requested
            # Assuming 'seats_total' is standard 180, and 'seats_available' matches the request
            # OR user meant capacity. I'll make availability high.
            seats_avail = random.randint(70, 180)
            
            flight_number = f"{random.choice(['AI','6E','SG','UK'])}{random.randint(1000,9999)}"
            
            f = Flight(
                id=uuid.uuid4(),
                flight_number = flight_number,
                airline = random.choice(airlines),
                origin = origin,
                destination = dest,
                departure_iso = flight_dt.isoformat(),
                arrival_iso = arr_dt.isoformat(),
                duration_min = duration,
                price_real = price,
                base_price = price,
                seats_total = 180,
                seats_available = seats_avail,
                flight_date = flight_dt.strftime("%Y-%m-%d")
            )
            db.add(f)
            added += 1
            
        db.commit()
        print(f"Successfully added {added} flights from {origin} to {dest} with 70-180 seats.")
        
    except Exception as e:
        print("Error during insertion:")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
