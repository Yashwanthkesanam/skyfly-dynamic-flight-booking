# app/api/v1/feeds.py
from fastapi import APIRouter, Query, Depends
from typing import List
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta
from app.db.base import SessionLocal
from app.db.models import Flight
from app.schemas.flight import FlightOut

router = APIRouter(prefix="/api/v1")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/simulate_feed", response_model=List[FlightOut])
def simulate_feed(count: int = Query(3, ge=1, le=1000), insert: bool = Query(False), db: Session = Depends(get_db)):
    origins = ['Hyderabad','Bengaluru','Mumbai','Delhi','Chennai','Kolkata']
    airlines = ['AirIndia','IndiGo','SpiceJet','Vistara']
    generated = []

    start_date = datetime(2025, 12, 10)
    end_date = datetime(2026, 2, 28)
    delta_days = (end_date - start_date).days

    for _ in range(count):
        origin = random.choice(origins)
        dest = random.choice([d for d in origins if d != origin])
        
        random_days = random.randint(0, delta_days)
        dep_dt = (start_date + timedelta(days=random_days)).replace(hour=random.randint(0,23), minute=random.choice([0,15,30,45]), second=0, microsecond=0)
        
        duration = random.choice([60,75,90,120,150])
        arr_dt = dep_dt + timedelta(minutes=duration)
        price = round(random.uniform(2000,7000), 2)
        flight_number = f"{random.choice(['AI','6E','SG','UK'])}{random.randint(100,999)}"
        flight_date = dep_dt.strftime("%Y-%m-%d")

        obj = {
            "flight_number": flight_number,
            "airline": random.choice(airlines),
            "origin": origin,
            "destination": dest,
            "departure_iso": dep_dt.isoformat(),
            "arrival_iso": arr_dt.isoformat(),
            "duration_min": duration,
            "price_real": price,
            "base_price": price,
            "seats_total": 180,
            "seats_available": random.randint(1,180),
            "flight_date": flight_date
        }
        generated.append(obj)

    inserted_rows = []
    if insert:
        for g in generated:
            f = Flight(
                flight_number = g["flight_number"],
                airline = g["airline"],
                origin = g["origin"],
                destination = g["destination"],
                departure_iso = g["departure_iso"],
                arrival_iso = g["arrival_iso"],
                duration_min = g["duration_min"],
                price_real = g["price_real"],
                base_price = g["base_price"],
                seats_total = g["seats_total"],
                seats_available = g["seats_available"],
                flight_date = g["flight_date"]
            )
            db.add(f)
        db.commit()
        # fetch last `count` inserted flights
        inserted_rows = db.query(Flight).order_by(Flight.id.desc()).limit(count).all()
        return inserted_rows

    # if not inserted, return generated objects with id=None
    return generated
