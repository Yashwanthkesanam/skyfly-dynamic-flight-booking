# app/services/booking_service.py
from typing import Optional, Tuple, Dict
from datetime import datetime, timezone, timedelta
import time
import json

from sqlalchemy.orm import Session
from sqlalchemy import func, update
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.db.models import Flight, Booking, FareHistory
from app.services.pricing import calculate_price
from app.utils.pnr import generate_pnr_unique
from app.utils.price_utils import now_utc_iso

# Config knobs
HOLD_SECONDS = 300
PNR_LENGTH = 6
PNR_ATTEMPTS = 8
CONFIRM_RETRY = 3
CONFIRM_RETRY_DELAY = 0.05


def _count_active_reservations(db: Session, flight_id: int) -> int:
    """
    Count seats in non-expired 'reserved' bookings for a flight using a single SQL query.

    Notes:
    - We compare ISO timestamps as strings; code uses .isoformat() so string compare works.
    - Returns an integer (0 if none).
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    total = db.query(func.coalesce(func.sum(Booking.seats_booked), 0)).filter(
        Booking.flight_id == flight_id,
        Booking.status == "reserved",
        Booking.hold_expires_at != None,
        Booking.hold_expires_at > now_iso
    ).scalar()
    return int(total or 0)


def reserve_seats(db: Session, flight_id: int, seats: int, passenger_name: Optional[str] = None, passenger_contact: Optional[str] = None) -> Tuple[Booking, float, dict]:
    """Create a reservation (hold). Returns booking, price_snapshot, breakdown."""
    if seats <= 0:
        raise ValueError("Seats must be >= 1")

    flight = db.get(Flight, flight_id)
    if not flight:
        raise ValueError("Flight not found")

    seats_available = int(getattr(flight, "seats_available", 0))
    reserved = _count_active_reservations(db, flight_id)
    effective_available = max(0, seats_available - reserved)
    if seats > effective_available:
        raise ValueError("Not enough seats available (consider existing holds)")

    # snapshot dynamic price using pricing engine, with demand score if available
    price_snapshot, breakdown = calculate_price(flight, demand_score=None)

    # create reservation entry
    hold_expires_at = (datetime.now(timezone.utc) + timedelta(seconds=HOLD_SECONDS)).isoformat()

    booking = Booking(
        flight_id=flight_id,
        seats_booked=seats,
        price_paid=None,
        price_snapshot=float(price_snapshot),
        passenger_name=passenger_name,
        passenger_contact=passenger_contact,
        status="reserved",
        hold_expires_at=hold_expires_at,
        updated_at=now_utc_iso()
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking, float(price_snapshot), breakdown


def confirm_reservation(db: Session, reservation_id: int, payment_success: bool = True, payment_meta: Optional[dict] = None) -> Tuple[Booking, str, Optional[dict]]:
    """
    Confirm a reservation transactionally.
    Returns booking, status_string, breakdown (when confirmed).

    Improvements:
      - SQL-level active reservations counting
      - atomic PNR assignment attempt (reduces race)
      - retry on IntegrityError
      - store payment_meta as JSON
      - clearer seat availability check excluding this reservation
    """
    last_exc = None
    for attempt_outer in range(CONFIRM_RETRY):
        try:
            with db.begin():
                booking = db.get(Booking, reservation_id)
                if not booking:
                    raise ValueError("Reservation not found")

                # idempotent checks
                if booking.status == "confirmed":
                    return booking, "already_confirmed", None
                if booking.status in ("cancelled", "expired"):
                    return booking, booking.status, None

                # expiry check
                if booking.hold_expires_at:
                    try:
                        exp = datetime.fromisoformat(booking.hold_expires_at)
                        if datetime.now(timezone.utc) > exp:
                            booking.status = "expired"
                            db.add(booking)
                            return booking, "expired", None
                    except Exception:
                        booking.status = "expired"
                        db.add(booking)
                        return booking, "expired", None

                flight = db.get(Flight, booking.flight_id)
                if not flight:
                    booking.status = "cancelled"
                    db.add(booking)
                    return booking, "flight_missing", None

                seats_needed = int(booking.seats_booked or 0)
                if seats_needed <= 0:
                    booking.status = "cancelled"
                    db.add(booking)
                    return booking, "invalid_seats", None

                # verify availability (consider other active reservations)
                reserved = _count_active_reservations(db, flight.id)
                # other reservations excluding this booking
                other_reserved = max(0, reserved - int(booking.seats_booked or 0))
                physical_left = int(flight.seats_available)
                if seats_needed > physical_left - other_reserved:
                    booking.status = "cancelled"
                    db.add(booking)
                    return booking, "insufficient_seats", None

                if not payment_success:
                    booking.status = "cancelled"
                    # store payment_meta as JSON string (best-effort)
                    try:
                        booking.payment_meta = json.dumps(payment_meta or {})
                    except Exception:
                        booking.payment_meta = str(payment_meta or {})
                    db.add(booking)
                    return booking, "payment_failed", None

                # Payment success: update flight and booking atomically
                flight.seats_available = max(0, int(flight.seats_available) - seats_needed)

                # Prefer locked snapshot if present on the reservation (better UX)
                if getattr(booking, "price_snapshot", None) is not None:
                    final_price = float(booking.price_snapshot)
                    breakdown = None
                else:
                    final_price, breakdown = calculate_price(flight, demand_score=None)

                booking.price_paid = float(final_price)
                booking.status = "confirmed"

                # --- atomic PNR write: try to set pnr atomically using UPDATE ... WHERE pnr IS NULL ---
                pnr_assigned = False
                max_pnr_attempts = PNR_ATTEMPTS
                for ptry in range(max_pnr_attempts):
                    # generate a candidate PNR (single-attempt generator)
                    candidate = generate_pnr_unique(lambda p: False, length=PNR_LENGTH, attempts=1)
                    stmt = update(Booking).where(Booking.id == booking.id, Booking.pnr == None).values(pnr=candidate)
                    res = db.execute(stmt)
                    if getattr(res, "rowcount", 0) == 1:
                        booking.pnr = candidate
                        pnr_assigned = True
                        break
                    # else someone else assigned; retry with a new candidate

                if not pnr_assigned:
                    # fallback: use generator that checks DB and rely on IntegrityError retry
                    booking.pnr = generate_pnr_unique(
                        lambda p: db.query(Booking).filter(Booking.pnr == p).first() is not None,
                        length=PNR_LENGTH,
                        attempts=PNR_ATTEMPTS
                    )

                # store payment_meta as JSON string (best-effort)
                try:
                    booking.payment_meta = json.dumps(payment_meta or {})
                except Exception:
                    booking.payment_meta = str(payment_meta or {})

                booking.updated_at = now_utc_iso()

                # create fare history audit
                fh = FareHistory(
                    flight_id=flight.id,
                    old_price=float(getattr(flight, "price_real", 0.0) or 0.0),
                    new_price=float(final_price),
                    reason="booking_confirm"
                )
                db.add(fh)
                flight.price_real = float(final_price)
                flight.last_price_updated = now_utc_iso()

                db.add(flight)
                db.add(booking)
                # commit at context exit of `with db.begin()`
                return booking, "confirmed", breakdown

        except IntegrityError as ie:
            # Likely a PNR uniqueness collision or similar constraint. Retry the entire confirm a few times.
            last_exc = ie
            try:
                db.rollback()
            except Exception:
                pass
            time.sleep(CONFIRM_RETRY_DELAY)
            continue
        except SQLAlchemyError as e:
            last_exc = e
            try:
                db.rollback()
            except Exception:
                pass
            time.sleep(CONFIRM_RETRY_DELAY)
            continue
        except Exception as e:
            last_exc = e
            try:
                db.rollback()
            except Exception:
                pass
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError("Unknown confirm failure")


def cancel_booking(db: Session, reservation_id: Optional[int] = None, pnr: Optional[str] = None, refund: bool = False, refund_meta: Optional[dict] = None) -> Tuple[Booking, Dict]:
    """
    Cancel reservation or confirmed booking. Restore seats if confirmed.
    If `refund` is True and booking was confirmed, simulate a refund by:
      - increasing flight.seats_available
      - recording a fare_history entry with reason 'refund'
      - recording refund information into booking.payment_meta (appended)
    Returns (booking, result_dict) where result_dict contains refund info when applicable.
    """
    if reservation_id:
        b = db.get(Booking, reservation_id)
    elif pnr:
        b = db.query(Booking).filter(Booking.pnr == pnr).first()
    else:
        raise ValueError("reservation_id or pnr must be provided")

    if not b:
        raise ValueError("Booking not found")

    if b.status == "cancelled":
        return b, {"status": "already_cancelled", "refunded": False}

    refunded = False
    refund_amount = None
    refund_record_meta = None

    # If booking is confirmed, restore seats and optionally refund
    if b.status == "confirmed":
        flight = db.get(Flight, b.flight_id)
        if flight:
            # restore seats
            flight.seats_available = int(flight.seats_available) + int(b.seats_booked)
            db.add(flight)

        # simulate refund
        if refund:
            refund_amount = float(b.price_paid) if b.price_paid is not None else 0.0
            refunded = True
            refund_record_meta = refund_meta or {}
            # append refund info into payment_meta (merge if existing)
            try:
                existing_pm = {}
                if b.payment_meta and isinstance(b.payment_meta, str) and b.payment_meta.strip():
                    try:
                        existing_pm = json.loads(b.payment_meta)
                    except Exception:
                        existing_pm = {"raw": b.payment_meta}
                existing_pm.setdefault("refunds", []).append({
                    "amount": refund_amount,
                    "meta": refund_record_meta,
                    "timestamp": now_utc_iso()
                })
                b.payment_meta = json.dumps(existing_pm)
            except Exception:
                # best-effort: fallback to simple string
                b.payment_meta = str({"refunds": [{"amount": refund_amount, "meta": refund_record_meta, "timestamp": now_utc_iso()}]})

            # create fare_history refund audit
            fh = FareHistory(
                flight_id=b.flight_id,
                old_price=float(getattr(flight, "price_real", 0.0) or 0.0),
                new_price=float(getattr(flight, "price_real", 0.0) or 0.0),
                reason="refund"
            )
            db.add(fh)

    # mark cancelled and update timestamp
    b.status = "cancelled"
    b.updated_at = now_utc_iso()
    db.add(b)
    db.commit()
    db.refresh(b)

    result = {
        "status": "cancelled",
        "refunded": refunded,
        "refund_amount": refund_amount,
        "refund_meta": refund_record_meta
    }
    return b, result
