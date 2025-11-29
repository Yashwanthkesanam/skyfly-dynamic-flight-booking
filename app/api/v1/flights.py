# app/api/v1/flights.py
from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.flight import FlightOut, FlightCreate, FlightUpdate
from app.db import models
from sqlalchemy import func, asc, desc, text
from sqlalchemy.exc import SQLAlchemyError
from zoneinfo import ZoneInfo
from datetime import datetime
from typing import Optional

# human-friendly normalizers
from app.utils.date_utils import normalize_date
from app.utils.time_utils import normalize_time
from app.utils.location_utils import normalize_city

from app.services.flight_service import (
    list_flights,
    search_flights,
    get_flight,
    create_flight,
    update_flight,
    delete_flight,
    get_flight_by_number,
)

router = APIRouter(prefix="/api/v1", tags=["flights"])


# -----------------------
# Helpers (DB-light, safe)
# -----------------------
def airport_exists(db: Session, value: str) -> bool:
    """Return True if a city or code exists in airports table."""
    if not value:
        return False
    v = value.lower()
    row = db.execute(
        text(
            """
            SELECT 1
            FROM airports
            WHERE lower(city) = :v OR lower(code) = :v
            LIMIT 1
            """
        ),
        {"v": v},
    ).fetchone()
    return row is not None


def get_airport_code(db: Session, value: str) -> Optional[str]:
    """
    Return airport code for a given city name or code.
    Example: 'Hyderabad' or 'hyd' -> 'HYD'
    """
    if not value:
        return None
    v = value.lower()
    row = db.execute(
        text(
            """
            SELECT code
            FROM airports
            WHERE lower(city) = :v OR lower(code) = :v
            LIMIT 1
            """
        ),
        {"v": v},
    ).fetchone()
    return row[0] if row else None
def log_search(db: Session, origin_code: Optional[str], destination_code: Optional[str], search_date: Optional[str]):
    """
    Insert a row into search_logs with searched_at in Asia/Kolkata formatted as:
    'Saturday 30 November 2025'. Non-blocking: errors are logged but won't raise.
    """
    try:
        # Full day + date + month + year in IST
        ist_ts = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%A %d %B %Y")
        db.execute(
            text(
                """
                INSERT INTO search_logs (origin_code, destination_code, search_date, searched_at)
                VALUES (:o, :d, :dt, :ts)
                """
            ),
            {"o": origin_code, "d": destination_code, "dt": search_date, "ts": ist_ts},
        )
        db.commit()
        return True
    except SQLAlchemyError as e:
        print("[LOG_SEARCH] write failed:", repr(e))
        return False
    except Exception as e:
        print("[LOG_SEARCH] unexpected error:", repr(e))
        return False



# ------------------------
# Flight existence helper (searches flights table)
# ------------------------
def _exists_in_db(db: Session, *, origin: Optional[str] = None, destination: Optional[str] = None) -> bool:
    q = db.query(models.Flight)
    if origin:
        q = q.filter(func.lower(models.Flight.origin) == origin.lower())
    if destination:
        q = q.filter(func.lower(models.Flight.destination) == destination.lower())
    return db.query(q.exists()).scalar()


# ============================================
# Lookup Flight (ID or Flight Number)
# ============================================
@router.get("/flights/lookup/{key}", response_model=FlightOut)
def api_lookup_flight(key: str, db: Session = Depends(get_db)):
    k = key.strip()
    f = get_flight_by_number(db, k.upper())
    if f:
        return f
    
    if k.isdigit():
        f = get_flight(db, int(k))
        if f:
            return f

    raise HTTPException(status_code=404, detail=f"Flight '{key}' not found")


# ============================================
# List Flights
# ============================================
@router.get("/flights", response_model=List[FlightOut])
def api_list_flights(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return list_flights(db, limit=limit, offset=offset)


# ============================================
# Search Flights (Human Friendly)
# ============================================
@router.get("/flights/search", response_model=List[FlightOut])
def api_search_flights(
    origin: Optional[str] = Query(None, min_length=1),
    destination: Optional[str] = Query(None, min_length=1),
    date: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0.0),
    max_price: Optional[float] = Query(None, ge=0.0),
    sort_by: Optional[str] = Query(None, regex="^(price|duration)$"),
    order: str = Query("asc", regex="^(asc|desc)$"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    # Normalize user input
    try:
        if origin:
            origin = normalize_city(origin)
        if destination:
            destination = normalize_city(destination)
        if date:
            date = normalize_date(date)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Same-city validation
    if origin and destination and origin.lower() == destination.lower():
        raise HTTPException(status_code=400, detail="Origin and destination cannot be the same.")

    # Prefer airport validation (more accurate). Fallback to flights table if airports not present.
    if origin:
        # if airports table exists and the value isn't found there, return friendly error
        if airport_exists(db, origin) is False and _exists_in_db(db, origin=origin) is False:
            raise HTTPException(status_code=422, detail=f"Unknown origin '{origin}'. Try Hyderabad, Bengaluru, etc.")
    if destination:
        if airport_exists(db, destination) is False and _exists_in_db(db, destination=destination) is False:
            raise HTTPException(status_code=422, detail=f"Unknown destination '{destination}'. Try Hyderabad, Bengaluru, etc.")

    # Resolve to airport codes for logging (best-effort)
    origin_code = get_airport_code(db, origin) if origin else None
    destination_code = get_airport_code(db, destination) if destination else None

    # Log the search (non-blocking)
    try:
        log_search(db, origin_code, destination_code, date)
    except Exception as e:
        # never break search if logging fails
        print("[LOG_SEARCH] unexpected error:", e)

    # Perform search using existing service
    return search_flights(db, origin, destination, date, min_price, max_price, sort_by, order, limit, offset)


# ============================================
# Search Flights via Path (Route Search)
# ============================================
@router.get("/flights/route/{origin}/{destination}", response_model=List[FlightOut])
def api_route_search(
    origin: str,
    destination: str,
    date: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0.0),
    max_price: Optional[float] = Query(None, ge=0.0),
    sort_by: Optional[str] = Query(None, regex="^(price|duration)$"),
    order: str = Query("asc", regex="^(asc|desc)$"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        origin = normalize_city(origin)
        destination = normalize_city(destination)
        if date:
            date = normalize_date(date)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Same-city validation
    if origin.lower() == destination.lower():
        raise HTTPException(status_code=400, detail="Origin and destination cannot be the same.")

    # Validate airports (best-effort)
    if origin and airport_exists(db, origin) is False:
        raise HTTPException(status_code=422, detail=f"Unknown origin '{origin}'.")
    if destination and airport_exists(db, destination) is False:
        raise HTTPException(status_code=422, detail=f"Unknown destination '{destination}'.")

    # Resolve codes & log
    origin_code = get_airport_code(db, origin)
    destination_code = get_airport_code(db, destination)
    try:
        log_search(db, origin_code, destination_code, date)
    except Exception:
        pass

    return search_flights(db, origin, destination, date, min_price, max_price, sort_by, order, limit, offset)


# =========================================================
# Feature 3: Popular Routes (use search_logs first, fallback to routes)
# =========================================================
@router.get("/flights/popular")
def api_popular_routes(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    # Primary: aggregate search_logs (if present)
    try:
        rows = db.execute(
            text("""
                SELECT origin_code, destination_code, COUNT(*) AS cnt
                FROM search_logs
                WHERE origin_code IS NOT NULL AND destination_code IS NOT NULL
                GROUP BY origin_code, destination_code
                ORDER BY cnt DESC
                LIMIT :limit
            """),
            {"limit": limit},
        ).fetchall()

        if rows:
            return [{"origin": r[0], "destination": r[1], "search_count": r[2]} for r in rows]
    except Exception as e:
        # table may not exist or other DB issue — fallback to routes
        print("[POPULAR] search_logs query failed:", e)

    # Fallback: seeded routes table
    rows = db.execute(
        text("SELECT origin_code, destination_code FROM routes LIMIT :limit"),
        {"limit": limit},
    ).fetchall()
    return [{"origin": r[0], "destination": r[1], "route_count": None} for r in rows]


# =========================================================
# Feature 4: Cheapest Flight
# =========================================================
@router.get("/flights/cheapest", response_model=Optional[FlightOut])
def api_cheapest_flight(
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        if origin:
            origin = normalize_city(origin)
        if destination:
            destination = normalize_city(destination)
        if date:
            date = normalize_date(date)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    q = db.query(models.Flight)
    if origin:
        q = q.filter(func.lower(models.Flight.origin) == origin.lower())
    if destination:
        q = q.filter(func.lower(models.Flight.destination) == destination.lower())
    if date:
        q = q.filter(models.Flight.flight_date == date)

    flight = q.order_by(models.Flight.price_real.asc()).first()
    return flight


# =========================================================
# Feature 5: Suggest Airports/Cities (uses airports table)
# =========================================================
@router.get("/flights/suggest")
def api_suggest(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db),
):
    term = f"%{q.strip().lower()}%"
    rows = db.execute(
        text(
            """
        SELECT city, code, airport_name
        FROM airports
        WHERE lower(city) LIKE :term OR lower(code) LIKE :term OR lower(airport_name) LIKE :term
        LIMIT :limit
        """
        ),
        {"term": term, "limit": limit},
    ).fetchall()

    results = []
    for r in rows:
        city = r[0]
        code = r[1]
        name = r[2] if r[2] else ""
        results.append({"city": city, "code": code, "airport_name": name})
    return results


# ============================================
# CRUD ENDPOINTS
# ============================================
@router.get("/flights/{flight_id}", response_model=FlightOut)
def api_get_flight(flight_id: int, db: Session = Depends(get_db)):
    f = get_flight(db, flight_id)
    if not f:
        raise HTTPException(status_code=404, detail="Flight not found")
    return f


@router.post("/flights", response_model=FlightOut, status_code=status.HTTP_201_CREATED)
def api_create_flight(flight_in: FlightCreate, db: Session = Depends(get_db)):
    existing = get_flight_by_number(db, flight_in.flight_number)
    if existing:
        raise HTTPException(status_code=400, detail="Flight number already exists")
    return create_flight(db, flight_in)


@router.put("/flights/{flight_id}", response_model=FlightOut)
def api_update_flight(flight_id: int, updates: FlightUpdate, db: Session = Depends(get_db)):
    f = get_flight(db, flight_id)
    if not f:
        raise HTTPException(status_code=404, detail="Flight not found")
    if updates.flight_number:
        other = get_flight_by_number(db, updates.flight_number)
        if other and other.id != flight_id:
            raise HTTPException(status_code=400, detail="Flight number already used by another flight")
    return update_flight(db, f, updates)


@router.delete("/flights/{flight_id}", status_code=status.HTTP_204_NO_CONTENT)
def api_delete_flight(flight_id: int, db: Session = Depends(get_db)):
    f = get_flight(db, flight_id)
    if not f:
        raise HTTPException(status_code=404, detail="Flight not found")
    delete_flight(db, f)
    return None
