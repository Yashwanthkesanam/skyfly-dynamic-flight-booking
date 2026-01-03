
import csv
import random
from datetime import datetime, timedelta, time
import os

def generate_canonical_data():
    # --- Configuration ---
    TARGET_RECORDS = 9999
    START_DATE = datetime(2025, 12, 10)
    END_DATE = datetime(2027, 1, 31)
    
    # 1. Airports
    METROS = ["DEL", "BOM", "BLR", "MAA", "HYD", "CCU"]
    MAJORS = ["AMD", "PNQ", "GOI", "COK", "JAI", "LKO", "GAU"]
    REGIONALS = ["IXC", "VTZ", "NAG", "PAT", "IXR", "STV", "IXL", "DED"]
    
    ALL_AIRPORTS = METROS + MAJORS + REGIONALS
    
    # 2. Airlines
    AIRLINES = [
        {"name": "IndiGo", "code": "6E"},
        {"name": "Air India", "code": "AI"},
        {"name": "Vistara", "code": "UK"},
        {"name": "Akasa Air", "code": "QP"},
        {"name": "SpiceJet", "code": "SG"},
        {"name": "Air India Express", "code": "IX"},
    ]

    # 3. Helper to generate a single flight record
    def create_flight(date_obj, origin, dest, time_of_day_hint=None):
        airline = random.choice(AIRLINES)
        flight_num = f"{airline['code']}{random.randint(100, 9999)}"
        
        # Duration approximate logic based on city types (dummy logic for mock data)
        # Real distance would be better but this is sufficient for mock
        base_dur = 60
        if origin in METROS and dest in METROS: base_dur = 135 # longer haul usually
        elif origin in REGIONALS or dest in REGIONALS: base_dur = 90
        
        duration_min = int(random.normalvariate(base_dur, 15))
        if duration_min < 45: duration_min = 45
        
        # Departure Time
        if time_of_day_hint == "morning":
            hour = random.randint(6, 11)
        elif time_of_day_hint == "evening":
            hour = random.randint(16, 21)
        elif time_of_day_hint == "night":
            hour = random.choice([22, 23, 0, 1, 2, 3, 4, 5])
        else:
            hour = random.randint(0, 23)
            
        minute = random.choice([0, 5, 10, 15, 30, 45])
        
        dep_dt = date_obj.replace(hour=hour, minute=minute, second=0)
        arr_dt = dep_dt + timedelta(minutes=duration_min)
        
        # Price Logic
        base_price = 2500 + (duration_min * 10)
        if airline['code'] in ["UK", "AI"]: base_price *= 1.2
        
        # Randomize real price
        price_real = round(base_price * random.uniform(0.8, 1.4), 2)
        base_price = round(base_price, 2)
        
        seats_total = 180
        seats_available = random.randint(0, 180)
        
        return [
            flight_num,
            airline['name'],
            origin,
            dest,
            dep_dt.isoformat(), # departure_iso
            arr_dt.isoformat(), # arrival_iso
            duration_min,
            price_real,
            base_price,
            seats_total,
            seats_available,
            date_obj.strftime("%Y-%m-%d"), # flight_date
            "" # last_price_updated
        ]

    records = []
    
    # Iterate Days
    curr_date = START_DATE
    day_count = (END_DATE - START_DATE).days
    
    # We need ~10,000 records over 400+ days ~ 25/day
    avg_per_day = int(TARGET_RECORDS / day_count) + 2
    
    print(f"Generating data from {START_DATE.date()} to {END_DATE.date()} (~{day_count} days). Target daily: {avg_per_day}")
    
    while curr_date <= END_DATE:
        daily_flights = []
        
        # 1. Guarantee Popular Routes (Metro-Metro) - Morning, Evening, Night
        # Pick 2 random Metro pairs per day to have high freq
        # 1. Guarantee Popular Routes (Metro-Metro) - Morning, Evening, Night
        # Fixed list of High-Traffic routes to ensure daily availability
        POPULAR_ROUTES = [
            ("DEL", "BLR"), ("BLR", "DEL"),
            ("DEL", "BOM"), ("BOM", "DEL"), 
            ("BOM", "BLR"), ("BLR", "BOM"),
            ("HYD", "BLR"), ("BLR", "HYD"),
            ("HYD", "DEL"), ("DEL", "HYD"),
            ("MAA", "DEL"), ("DEL", "MAA"),
            ("CCU", "DEL"), ("DEL", "CCU")
        ]
        
        for p_origin, p_dest in POPULAR_ROUTES:
            daily_flights.append(create_flight(curr_date, p_origin, p_dest, "morning"))
            daily_flights.append(create_flight(curr_date, p_origin, p_dest, "evening"))
            # Optional night flight for very busy routes
            if p_origin in ["DEL", "BOM"] and p_dest in ["DEL", "BOM", "BLR"]:
                 daily_flights.append(create_flight(curr_date, p_origin, p_dest, "night"))
        
        # 2. Ensure Coverage - Pick random Metro-Major or Major-Major
        # Fill remaining slots to meet daily quota
        while len(daily_flights) < avg_per_day:
            # high chance of Metro endpoint
            if random.random() < 0.7:
                orig = random.choice(METROS)
                dest = random.choice(MAJORS + REGIONALS)
            else:
                orig = random.choice(MAJORS)
                dest = random.choice(MAJORS + REGIONALS)
                
            if orig == dest: continue
            
            # 50% chance to swap to enforce bi-directionality over time
            if random.random() < 0.5:
                orig, dest = dest, orig
                
            daily_flights.append(create_flight(curr_date, orig, dest))
            
        records.extend(daily_flights)
        curr_date += timedelta(days=1)

    # Write to CSV
    header = [
        "flight_number", "airline", "origin", "destination", 
        "departure_iso", "arrival_iso", "duration_min", 
        "price_real", "base_price", "seats_total", 
        "seats_available", "flight_date", "last_price_updated"
    ]
    
    filename = "india_flights_canonical.csv"
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(records)
        
    print(f"Success! Generated {filename} with {len(records)} rows.")

if __name__ == "__main__":
    generate_canonical_data()
