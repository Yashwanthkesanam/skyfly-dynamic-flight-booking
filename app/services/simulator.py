# app/services/simulator.py
import threading
import time
import random
from app.utils.price_utils import should_update_price, now_utc_iso, DEFAULT_MIN_UPDATE_SECONDS, seconds_since_iso
from datetime import datetime, timezone, timedelta
try:
    from zoneinfo import ZoneInfo
    _HAS_ZONEINFO = True
except Exception:
    _HAS_ZONEINFO = False
from typing import Optional

from app.db.base import SessionLocal
from app.db import models
from app.services.pricing import calculate_price

# ----------------------------
# Config: schedule (IST)
# ----------------------------
# User schedule (as requested):
# 09:00–12:00 -> 8 minute updates
# 12:00–18:00 -> 20 minute updates
# 18:00–21:00 -> 8 minute updates
# 21:00–24:00 -> 90 minute updates
# 00:00–06:00 -> 6 hour updates
# 06:00–09:00 -> fallback (30 minutes)
_SCHEDULE = [
    ((9, 12), 8 * 60),        # 09:00 - 11:59 -> 8 minutes
    ((12, 18), 20 * 60),      # 12:00 - 17:59 -> 20 minutes
    ((18, 21), 8 * 60),       # 18:00 - 20:59 -> 8 minutes
    ((21, 24), 90 * 60),      # 21:00 - 23:59 -> 90 minutes
    ((0, 6), 6 * 60 * 60),    # 00:00 - 05:59 -> 6 hours
]
_FALLBACK_INTERVAL = 30 * 60   # 06:00 - 08:59 -> 30 minutes

# Behavior knobs
BATCH_SIZE = 6      # how many flights to sample per tick

# Internal control
_stop_flag = False
_thread: Optional[threading.Thread] = None
_override_interval: Optional[int] = None  # if set, always use this interval (seconds)


# ----------------------------
# Helpers
# ----------------------------
def _interval_for_now_ist(now: Optional[datetime] = None) -> int:
    """
    Return interval (seconds) based on IST schedule.
    Uses ZoneInfo('Asia/Kolkata') when available; otherwise falls back to UTC+5:30 offset.
    """
    # compute current IST time
    if now is None:
        if _HAS_ZONEINFO:
            try:
                now = datetime.now(ZoneInfo("Asia/Kolkata"))
            except Exception:
                # fallback to manual offset if ZoneInfo fails unexpectedly
                now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        else:
            now = datetime.utcnow() + timedelta(hours=5, minutes=30)

    hour = now.hour
    for (start, end), seconds in _SCHEDULE:
        if start <= hour < end:
            return seconds
    return _FALLBACK_INTERVAL


def current_interval_preview() -> int:
    """Return the interval (seconds) the simulator will use right now (honors override)."""
    if _override_interval:
        return _override_interval
    return _interval_for_now_ist()


# ----------------------------
# DB update logic
# ----------------------------
def _update_one(db, flight):
    """
    Single-flight update:
      - small random bookings (persist to bookings)
      - random-walk demand score (persist to demand_scores)
      - recalculate dynamic price via calculate_price(), persist to fare_history if changed
      - enforce cooldown using last_price_updated and DEFAULT_MIN_UPDATE_SECONDS
    """
    try:
        # small random bookings
        if flight.seats_available > 0 and random.random() < 0.25:
            taken = random.randint(1, min(3, int(flight.seats_available)))
            flight.seats_available = max(0, flight.seats_available - taken)
            b = models.Booking(flight_id=flight.id, seats_booked=taken, price_paid=flight.price_real)
            db.add(b)

        # demand score update (small random walk)
        ds = db.query(models.DemandScore).filter(models.DemandScore.flight_id == flight.id).first()
        if not ds:
            ds_val = random.random() * 0.15
            ds = models.DemandScore(
                flight_id=flight.id,
                origin_code=flight.origin,
                destination_code=flight.destination,
                score=ds_val
            )
            db.add(ds)
        else:
            ds.score = min(1.0, max(0.0, ds.score + random.uniform(-0.03, 0.12)))
            ds.updated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        # -------------------------
        # dynamic pricing calculation
        # -------------------------
        now_utc = datetime.now(timezone.utc)
        new_price, breakdown = calculate_price(flight, demand_score=ds.score, now=now_utc)
        old_price = float(getattr(flight, "price_real", 0.0))

        # if no candidate price, skip
        if new_price is None:
            return

        # Check cooldown: only persist if cooldown elapsed
        try:
            can_update = should_update_price(flight.last_price_updated, min_update_seconds=DEFAULT_MIN_UPDATE_SECONDS)
        except Exception:
            # conservative fallback — allow update if helper fails
            can_update = True

        if can_update:
            # significance threshold: require either >=1% relative change or >= absolute small delta (₹50)
            rel_change = abs(new_price - old_price) / (old_price if old_price else (flight.base_price or 1.0))
            abs_delta = abs(new_price - old_price)
            SIGNIFICANCE_PCT = 0.01   # 1%
            SIGNIFICANCE_ABS = 50.0   # currency units

            if rel_change >= SIGNIFICANCE_PCT or abs_delta >= SIGNIFICANCE_ABS:
                fh = models.FareHistory(flight_id=flight.id, old_price=old_price, new_price=new_price, reason="simulator")
                db.add(fh)
                flight.price_real = float(new_price)
                flight.last_price_updated = now_utc_iso()
            else:
                # change too small — skip price update but STILL update timestamp
                flight.last_price_updated = now_utc_iso()
        else:
            # cooldown active — skip persistence
            pass

    except Exception as e:
        # don't raise — caller will handle rollback
        pass


def tick_once():
    """
    Public: run a single simulation cycle (useful for manual testing).
    This will open a DB session, update a sampled batch and commit.
    """
    db = SessionLocal()
    try:
        flights = db.query(models.Flight).order_by(models.Flight.id).all()
        if not flights:
            return 0
        sample = random.sample(flights, min(BATCH_SIZE, len(flights)))
        for fl in sample:
            _update_one(db, fl)
        db.commit()
        return len(sample)
    except Exception as e:
        db.rollback()
        return 0
    finally:
        db.close()


# ----------------------------
# Background loop
# ----------------------------
def _loop():
    global _stop_flag
    while not _stop_flag:
        try:
            tick_once()
        except Exception:
            pass

        # choose interval: override has priority, otherwise time-of-day schedule
        if _override_interval is not None:
            sleep_seconds = _override_interval
        else:
            sleep_seconds = _interval_for_now_ist()

        # sleep in short chunks so stop() responds quickly
        slept = 0
        while slept < sleep_seconds and not _stop_flag:
            to_sleep = min(5, sleep_seconds - slept)
            time.sleep(to_sleep)
            slept += to_sleep


# ----------------------------
# Control API
# ----------------------------
def start(interval: Optional[int] = None):
    """
    Start background simulator thread.
      - interval (seconds) optional override for development/testing.
      - If already running, function returns silently.
    """
    global _thread, _stop_flag, _override_interval
    if interval is not None:
        _override_interval = int(interval)
    else:
        _override_interval = None

    if _thread and _thread.is_alive():
        return

    _stop_flag = False
    _thread = threading.Thread(target=_loop, daemon=True)
    _thread.start()


def stop():
    """Signal the background thread to stop. It will exit at the next checkpoint."""
    global _stop_flag
    _stop_flag = True


def status() -> dict:
    """Return a small diagnostic useful for debug/demo."""
    return {
        "running": bool(_thread and _thread.is_alive()),
        "override_interval": _override_interval,
        "current_interval_seconds": current_interval_preview()
    }