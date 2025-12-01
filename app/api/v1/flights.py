# app/api/v1/flights.py
from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.api.deps import get_db

from app.schemas.flight import (
    FlightOut,
    FlightCreate,
    FlightUpdate,
    FlightOutWithDynamic,
)
from app.db import models
from sqlalchemy import func, text
from sqlalchemy.exc import SQLAlchemyError
from zoneinfo import ZoneInfo
from datetime import datetime

from app.services.pricing import calculate_price

# human-friendly normalizers
from app.utils.date_utils import normalize_date
from app.utils.time_utils import normalize_time
from app.utils.location_utils import normalize_city

# price utils (cooldown + human time)
from app.utils.price_utils import (
    human_time,
    should_update_price,
    seconds_since_iso,
    DEFAULT_MIN_UPDATE_SECONDS,
)

# services
from app.services.flight_service import (
    list_flights,
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


# ---------------------------------------
# Small formatting helpers used below
# ---------------------------------------
def _human_time_safe(ts):
    """Return human_time(ts) or None if ts falsy."""
    if not ts:
        return None
    try:
        return human_time(str(ts))
    except Exception:
        return str(ts)


def _human_field(v):
    """Convert departure/arrival stored value to human string safely."""
    if v is None:
        return None
    try:
        # if it's already a string ISO, human_time will parse
        return human_time(str(v))
    except Exception:
        return str(v)


# ============================================
# Lookup Flight (ID or Flight Number)
# Returns human-friendly times
# ============================================
@router.get("/flights/lookup/{key}", response_model=FlightOut)
def api_lookup_flight(key: str, db: Session = Depends(get_db)):
    """
    Lookup by flight number or numeric id.
    Returns human-friendly departure/arrival and last_price_updated.
    """
    k = key.strip()
    f = get_flight_by_number(db, k.upper())
    if not f and k.isdigit():
        f = get_flight(db, int(k))

    if not f:
        raise HTTPException(status_code=404, detail=f"Flight '{key}' not found")

    base_price = getattr(f, "base_price", None) or getattr(f, "price_real", 0.0)
    return {
        "id": int(f.id) if f.id is not None else None,
        "flight_number": str(f.flight_number),
        "airline": str(f.airline),
        "origin": str(f.origin),
        "destination": str(f.destination),
        "departure_iso": _human_field(getattr(f, "departure_iso", None)),
        "arrival_iso": _human_field(getattr(f, "arrival_iso", None)),
        "duration_min": int(f.duration_min),
        "price_real": float(f.price_real),
        "base_price": float(base_price),
        "seats_total": int(f.seats_total),
        "seats_available": int(f.seats_available),
        "flight_date": str(f.flight_date),
        "last_price_updated": _human_time_safe(getattr(f, "last_price_updated", None)),
    }


# ============================================
# List Flights (unchanged behaviour)
# ============================================
@router.get("/flights", response_model=List[FlightOut])
def api_list_flights(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return list_flights(db, limit=limit, offset=offset)


# ============================================
# Search Flights (Human Friendly) - returns dynamic pricing
# ============================================
@router.get("/flights/search", response_model=List[FlightOutWithDynamic])
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
    except Exception:
        pass

    # Build base query using SQLAlchemy models
    q = db.query(models.Flight)
    if origin:
        q = q.filter(func.lower(models.Flight.origin) == origin.lower())
    if destination:
        q = q.filter(func.lower(models.Flight.destination) == destination.lower())
    if date:
        q = q.filter(models.Flight.flight_date == date)
    if min_price is not None:
        q = q.filter(models.Flight.price_real >= min_price)
    if max_price is not None:
        q = q.filter(models.Flight.price_real <= max_price)

    # Sorting
    if sort_by == "price":
        q = q.order_by(models.Flight.price_real.asc() if order == "asc" else models.Flight.price_real.desc())
    elif sort_by == "duration":
        q = q.order_by(models.Flight.duration_min.asc() if order == "asc" else models.Flight.duration_min.desc())
    else:
        q = q.order_by(models.Flight.id.asc())

    # Pagination
    flights = q.offset(offset).limit(limit).all()

    # Batch load demand scores for efficiency
    flight_ids = [f.id for f in flights if getattr(f, "id", None) is not None]
    demand_map = {}
    if flight_ids:
        ds_rows = db.query(models.DemandScore).filter(models.DemandScore.flight_id.in_(flight_ids)).all()
        demand_map = {ds.flight_id: ds.score for ds in ds_rows}

    # Build results with dynamic price
    results = []
    for f in flights:
        demand_score = float(demand_map.get(f.id, 0.0))

        # Calculate price
        new_price_raw, breakdown = calculate_price(f, demand_score=demand_score)
        try:
            new_price = float(new_price_raw) if new_price_raw is not None else None
        except Exception:
            new_price = None

        base_price = float(getattr(f, "base_price", None) or getattr(f, "price_real", 0.0) or 0.0)
        price_increase_percent = None
        if base_price and new_price is not None:
            try:
                price_increase_percent = round((new_price - base_price) / base_price * 100, 1)
            except Exception:
                price_increase_percent = None

        # Determine whether to show computed dynamic price or the published (stable) price_real
        computed_price = round(new_price, 2) if new_price is not None else None

        # If cooldown active, show published price_real instead of computed price
        if not should_update_price(getattr(f, "last_price_updated", None), DEFAULT_MIN_UPDATE_SECONDS):
            dynamic_price = float(f.price_real)
            price_breakdown_out = None
            price_cached_seconds_left = max(0, DEFAULT_MIN_UPDATE_SECONDS - int(seconds_since_iso(getattr(f, "last_price_updated", None) or 0)))
        else:
            dynamic_price = computed_price
            price_breakdown_out = breakdown if isinstance(breakdown, dict) else None
            price_cached_seconds_left = 0

        results.append({
            "id": int(f.id) if f.id is not None else None,
            "flight_number": str(f.flight_number),
            "airline": str(f.airline),
            "origin": str(f.origin),
            "destination": str(f.destination),
            # human-friendly departure/arrival (IST)
            "departure_iso": _human_field(getattr(f, "departure_iso", None)),
            "arrival_iso": _human_field(getattr(f, "arrival_iso", None)),
            "duration_min": int(f.duration_min),
            "price_real": float(f.price_real),
            "base_price": base_price,
            "dynamic_price": dynamic_price,
            "price_increase_percent": price_increase_percent,
            "seats_total": int(f.seats_total),
            "seats_available": int(f.seats_available),
            "flight_date": str(f.flight_date),
            "demand_score": float(demand_score),
            "price_breakdown": price_breakdown_out,
            # only the human-friendly timestamp (no raw ISO)
            "last_price_updated": _human_time_safe(getattr(f, "last_price_updated", None)),
            # optional helper so front-end can show countdown (0 if live)
            "price_cached_seconds_left": int(price_cached_seconds_left),
        })

    return results


# ============================================
# Search Flights via Path (Route Search) - dynamic pricing too
# (same behaviour as /flights/search but route path)
# ============================================
@router.get("/flights/route/{origin}/{destination}", response_model=List[FlightOutWithDynamic])
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

    if origin.lower() == destination.lower():
        raise HTTPException(status_code=400, detail="Origin and destination cannot be the same.")

    if origin and airport_exists(db, origin) is False:
        raise HTTPException(status_code=422, detail=f"Unknown origin '{origin}'.")
    if destination and airport_exists(db, destination) is False:
        raise HTTPException(status_code=422, detail=f"Unknown destination '{destination}'.")

    origin_code = get_airport_code(db, origin)
    destination_code = get_airport_code(db, destination)
    try:
        log_search(db, origin_code, destination_code, date)
    except Exception:
        pass

    q = db.query(models.Flight).filter(
        func.lower(models.Flight.origin) == origin.lower(),
        func.lower(models.Flight.destination) == destination.lower(),
    )
    if date:
        q = q.filter(models.Flight.flight_date == date)
    if min_price is not None:
        q = q.filter(models.Flight.price_real >= min_price)
    if max_price is not None:
        q = q.filter(models.Flight.price_real <= max_price)

    if sort_by == "price":
        q = q.order_by(models.Flight.price_real.asc() if order == "asc" else models.Flight.price_real.desc())
    elif sort_by == "duration":
        q = q.order_by(models.Flight.duration_min.asc() if order == "asc" else models.Flight.duration_min.desc())
    else:
        q = q.order_by(models.Flight.id.asc())

    flights = q.offset(offset).limit(limit).all()

    # batch demand load
    flight_ids = [f.id for f in flights if getattr(f, "id", None) is not None]
    demand_map = {}
    if flight_ids:
        ds_rows = db.query(models.DemandScore).filter(models.DemandScore.flight_id.in_(flight_ids)).all()
        demand_map = {ds.flight_id: ds.score for ds in ds_rows}

    results = []
    for f in flights:
        demand_score = float(demand_map.get(f.id, 0.0))
        new_price_raw, breakdown = calculate_price(f, demand_score=demand_score)
        try:
            new_price = float(new_price_raw) if new_price_raw is not None else None
        except Exception:
            new_price = None

        base_price = float(getattr(f, "base_price", None) or getattr(f, "price_real", 0.0) or 0.0)
        price_increase_percent = None
        if base_price and new_price is not None:
            try:
                price_increase_percent = round((new_price - base_price) / base_price * 100, 1)
            except Exception:
                price_increase_percent = None

        computed_price = round(new_price, 2) if new_price is not None else None

        if not should_update_price(getattr(f, "last_price_updated", None), DEFAULT_MIN_UPDATE_SECONDS):
            dynamic_price = float(f.price_real)
            price_breakdown_out = None
            price_cached_seconds_left = max(0, DEFAULT_MIN_UPDATE_SECONDS - int(seconds_since_iso(getattr(f, "last_price_updated", None) or 0)))
        else:
            dynamic_price = computed_price
            price_breakdown_out = breakdown if isinstance(breakdown, dict) else None
            price_cached_seconds_left = 0

        results.append({
            "id": int(f.id) if f.id is not None else None,
            "flight_number": str(f.flight_number),
            "airline": str(f.airline),
            "origin": str(f.origin),
            "destination": str(f.destination),
            "departure_iso": _human_field(getattr(f, "departure_iso", None)),
            "arrival_iso": _human_field(getattr(f, "arrival_iso", None)),
            "duration_min": int(f.duration_min),
            "price_real": float(f.price_real),
            "base_price": base_price,
            "dynamic_price": dynamic_price,
            "price_increase_percent": price_increase_percent,
            "seats_total": int(f.seats_total),
            "seats_available": int(f.seats_available),
            "flight_date": str(f.flight_date),
            "demand_score": float(demand_score),
            "price_breakdown": price_breakdown_out,
            "last_price_updated": _human_time_safe(getattr(f, "last_price_updated", None)),
            "price_cached_seconds_left": int(price_cached_seconds_left),
        })

    return results


# =========================================================
# Popular Routes (uses search_logs first, fallback to routes)
# =========================================================
@router.get("/flights/popular")
def api_popular_routes(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
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
        print("[POPULAR] search_logs query failed:", e)

    rows = db.execute(
        text("SELECT origin_code, destination_code FROM routes LIMIT :limit"),
        {"limit": limit},
    ).fetchall()
    return [{"origin": r[0], "destination": r[1], "route_count": None} for r in rows]


# =========================================================
# Cheapest Flight (returns human times)
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

    f = q.order_by(models.Flight.price_real.asc()).first()
    if not f:
        return None

    base_price = getattr(f, "base_price", None) or getattr(f, "price_real", 0.0)
    return {
        "id": int(f.id) if f.id is not None else None,
        "flight_number": str(f.flight_number),
        "airline": str(f.airline),
        "origin": str(f.origin),
        "destination": str(f.destination),
        "departure_iso": _human_field(getattr(f, "departure_iso", None)),
        "arrival_iso": _human_field(getattr(f, "arrival_iso", None)),
        "duration_min": int(f.duration_min),
        "price_real": float(f.price_real),
        "base_price": float(base_price),
        "seats_total": int(f.seats_total),
        "seats_available": int(f.seats_available),
        "flight_date": str(f.flight_date),
        "last_price_updated": _human_time_safe(getattr(f, "last_price_updated", None)),
    }


# =========================================================
# Suggest Airports/Cities
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

    base_price = getattr(f, "base_price", None) or getattr(f, "price_real", 0.0)
    return {
        "id": int(f.id) if f.id is not None else None,
        "flight_number": str(f.flight_number),
        "airline": str(f.airline),
        "origin": str(f.origin),
        "destination": str(f.destination),
        "departure_iso": _human_field(getattr(f, "departure_iso", None)),
        "arrival_iso": _human_field(getattr(f, "arrival_iso", None)),
        "duration_min": int(f.duration_min),
        "price_real": float(f.price_real),
        "base_price": float(base_price),
        "seats_total": int(f.seats_total),
        "seats_available": int(f.seats_available),
        "flight_date": str(f.flight_date),
        "last_price_updated": _human_time_safe(getattr(f, "last_price_updated", None)),
    }


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
