# app/services/flight_service.py
from app.services.pricing import calculate_price
from typing import List, Optional
from sqlalchemy import select, asc, desc, func
from sqlalchemy.orm import Session
from app.db.models import Flight
from app.schemas.flight import FlightCreate, FlightUpdate
from app.db import models
def list_flights(db: Session, limit: int = 50, offset: int = 0) -> List[Flight]:
    stmt = select(Flight).limit(limit).offset(offset)
    return db.execute(stmt).scalars().all()

def get_flight(db: Session, flight_id: int) -> Optional[Flight]:
    return db.get(Flight, flight_id)

def get_flight_by_number(db: Session, flight_number: str) -> Optional[Flight]:
    stmt = select(Flight).where(Flight.flight_number == flight_number)
    return db.execute(stmt).scalars().first()

def create_flight(db: Session, flight_in: FlightCreate) -> Flight:
    f = Flight(
        flight_number=flight_in.flight_number,
        airline=flight_in.airline,
        origin=flight_in.origin,
        destination=flight_in.destination,
        departure_iso=flight_in.departure_iso,
        arrival_iso=flight_in.arrival_iso,
        duration_min=flight_in.duration_min,
        price_real=flight_in.price_real,
        base_price=flight_in.base_price,
        seats_total=flight_in.seats_total,
        seats_available=flight_in.seats_available,
        flight_date=flight_in.flight_date
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

def update_flight(db: Session, flight_obj: Flight, updates: FlightUpdate) -> Flight:
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(flight_obj, field, value)
    db.add(flight_obj)
    db.commit()
    db.refresh(flight_obj)
    return flight_obj

def delete_flight(db: Session, flight_obj: Flight) -> None:
    db.delete(flight_obj)
    db.commit()

def search_flights(
    db: Session,
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    date: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = None,
    order: str = "asc",
    limit: int = 50,
    offset: int = 0
):
    """
    Returns a list of Flight objects matching filters. Uses case-insensitive partial matching
    for origin/destination (portable across DB backends).
    """
    stmt = select(Flight)

    if origin:
        stmt = stmt.where(func.lower(Flight.origin).like(f"%{origin.lower()}%"))
    if destination:
        stmt = stmt.where(func.lower(Flight.destination).like(f"%{destination.lower()}%"))
    if date:
        stmt = stmt.where(Flight.flight_date == date)
    if min_price is not None:
        stmt = stmt.where(Flight.price_real >= min_price)
    if max_price is not None:
        stmt = stmt.where(Flight.price_real <= max_price)

    if sort_by == "price":
        col = Flight.price_real
    elif sort_by == "duration":
        col = Flight.duration_min
    else:
        col = None

    if col is not None:
        stmt = stmt.order_by(asc(col) if order == "asc" else desc(col))

    stmt = stmt.limit(limit).offset(offset)
    rows = db.execute(stmt).scalars().all()
    return rows


def search_flights(db, origin, destination, date, min_price, max_price, sort_by, order, limit, offset):
    q = db.query(models.Flight)  # existing filters...
    rows = q.offset(offset).limit(limit).all()

    results = []
    # fetch demand scores in batch to be efficient
    flight_ids = [r.id for r in rows]
    ds_map = {}
    if flight_ids:
        ds_rows = db.query(models.DemandScore).filter(models.DemandScore.flight_id.in_(flight_ids)).all()
        ds_map = {d.flight_id: d.score for d in ds_rows}

    for r in rows:
        dscore = ds_map.get(r.id, None)
        price, breakdown = calculate_price(r, demand_score=dscore)
        # You may include breakdown if debug mode
        out = {
            "flight_number": r.flight_number,
            "airline": r.airline,
            "origin": r.origin,
            "destination": r.destination,
            "departure_iso": r.departure_iso,
            "arrival_iso": r.arrival_iso,
            "duration_min": r.duration_min,
            "price_real": price,
            "base_price": r.base_price,
            "seats_total": r.seats_total,
            "seats_available": r.seats_available,
            "flight_date": r.flight_date,
            "id": r.id,
        }
        results.append(out)
    return results