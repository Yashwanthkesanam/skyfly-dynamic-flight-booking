# app/services/pricing.py
from datetime import datetime, timezone
from math import exp, log
from typing import Optional

# TUNABLE PARAMETERS (business knobs)
TIME_MAX_MULT = 1.6        # up to +60% due to time pressure
TIME_HALF_HOURS = 48 * 1.0 # half effect around 48 hours
SEAT_ALPHA = 0.45          # max seat pressure contribution (45%)
SEAT_BETA = 4.0            # shape for exponential seat curve
DEMAND_WEIGHT = 0.45       # weight of demand score influence
MIN_PRICE_FACTOR = 0.6     # floor (60% of base)
MAX_PRICE_FACTOR = 3.0     # cap (3x base)

def _hours_to_departure(departure_iso: Optional[str], now: Optional[datetime]):
    if not departure_iso:
        return None
    try:
        dep = datetime.fromisoformat(departure_iso)
    except Exception:
        return None
    if dep.tzinfo is None:
        dep = dep.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return (dep - now).total_seconds() / 3600.0

def time_factor(hours: Optional[float]):
    if hours is None:
        return 1.0
    if hours <= 0:
        return TIME_MAX_MULT
    # inverse logistic-like via half-life
    # smaller hours -> factor closer to TIME_MAX_MULT
    return 1.0 + (TIME_MAX_MULT - 1.0) * (1.0 / (1.0 + (hours / TIME_HALF_HOURS)))

def seat_factor(seats_available: int, seats_total: int):
    if seats_total <= 0:
        return 1.0
    pct = seats_available / float(seats_total)
    scarcity = max(0.0, 1.0 - pct)  # 0..1
    # exponential response: low scarcity small effect, high scarcity large effect
    factor = 1.0 + SEAT_ALPHA * (1.0 - exp(-SEAT_BETA * scarcity))
    return float(factor)

def demand_factor(demand_score: Optional[float]):
    if demand_score is None:
        demand_score = 0.0
    # keep demand_score in 0..1
    ds = max(0.0, min(1.0, float(demand_score)))
    return 1.0 + (ds * DEMAND_WEIGHT)

def clamp_price(base: float, price: float):
    min_p = base * MIN_PRICE_FACTOR
    max_p = base * MAX_PRICE_FACTOR
    return max(min_p, min(price, max_p))

def calculate_price(flight_row, demand_score: Optional[float] = None, now: Optional[datetime] = None):
    """
    flight_row: ORM obj or dict with 'base_price', 'price_real', 'seats_available', 'seats_total', 'departure_iso'
    returns (new_price: float, breakdown: dict)
    """
    if now is None:
        now = datetime.utcnow().replace(tzinfo=timezone.utc)

    base = getattr(flight_row, "base_price", None) or getattr(flight_row, "price_real", 0.0)
    try:
        base = float(base)
    except Exception:
        base = 0.0

    seats_available = int(getattr(flight_row, "seats_available", 0))
    seats_total = int(getattr(flight_row, "seats_total", seats_available or 1))
    departure_iso = getattr(flight_row, "departure_iso", None)

    hours = _hours_to_departure(departure_iso, now)
    t_mult = time_factor(hours)
    s_mult = seat_factor(seats_available, seats_total)
    d_mult = demand_factor(demand_score)

    raw = base * t_mult * s_mult * d_mult
    final = clamp_price(base, raw)

    breakdown = {
        "base": round(base,2),
        "hours_to_departure": None if hours is None else round(hours,2),
        "time_mult": round(t_mult,4),
        "seat_mult": round(s_mult,4),
        "demand_mult": round(d_mult,4),
        "raw_price": round(raw,2),
        "clamped_price": round(final,2)
    }
    return round(final,2), breakdown
