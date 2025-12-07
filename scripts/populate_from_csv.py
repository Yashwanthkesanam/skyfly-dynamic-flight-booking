import sys
import os
import pandas as pd
from datetime import datetime, timedelta
import traceback

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal, Base, engine
from app.db.models import Flight

def main():
    print("Starting CSV import...")
    csv_file = "india_flights_canonical.csv"
    
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found. Please run scripts/generate_csv.py first.")
        return
        
    # Ensure tables exist (helpful if we deleted the DB)
    print("Ensuring database schema exists...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    
    try:
        df = pd.read_csv(csv_file)
        print(f"Loaded {len(df)} rows from CSV.")
        
        added_count = 0
        
        for _, row in df.iterrows():
            # CSV Schema:
            # flight_number,airline,origin,destination,departure_iso,arrival_iso,duration_min,
            # price_real,base_price,seats_total,seats_available,flight_date,last_price_updated

            # Map to DB Model
            f = Flight(
                # id=uuid.uuid4(),  <-- Removing this to allow AutoIncrement
                flight_number = row['flight_number'],
                airline = row['airline'],
                origin = row['origin'], 
                destination = row['destination'],
                departure_iso = row['departure_iso'],
                arrival_iso = row['arrival_iso'],
                duration_min = int(row['duration_min']),
                price_real = float(row['price_real']),
                base_price = float(row['base_price']),
                seats_total = int(row['seats_total']),
                seats_available = int(row['seats_available']),
                flight_date = row['flight_date']
            )
            
            # City Mapper
            city_map = {
                "DEL": "Delhi", "BOM": "Mumbai", "BLR": "Bengaluru", 
                "MAA": "Chennai", "HYD": "Hyderabad", "CCU": "Kolkata",
                "AMD": "Ahmedabad", "PNQ": "Pune", "GOI": "Goa", 
                "COK": "Kochi", "JAI": "Jaipur", "LKO": "Lucknow", "GAU": "Guwahati",
                "IXC": "Chandigarh", "VTZ": "Visakhapatnam", "NAG": "Nagpur",
                "PAT": "Patna", "IXR": "Ranchi", "STV": "Surat", 
                "IXL": "Leh", "DED": "Dehradun"
            }
            
            if f.origin in city_map: f.origin = city_map[f.origin]
            if f.destination in city_map: f.destination = city_map[f.destination]
            
            db.add(f)
            added_count += 1
            
            if added_count % 100 == 0:
                print(f"Processed {added_count} records...", end='\r')
            


        db.commit()
        print(f"\nSuccessfully imported {added_count} flights from CSV.")

    except Exception as e:
        print("\nError during import:")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
