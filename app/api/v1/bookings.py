# app/api/v1/bookings.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import json

from app.api.deps import get_db
from app.schemas.booking import (
    ReserveRequest,
    ReserveResponse,
    ConfirmRequest,
    ConfirmResponse,
    CancelRequest,
    CancelResponse,
    BookingOut,
    FlightShort,
    ReceiptOut,
)
from app.services.booking_service import reserve_seats, confirm_reservation, cancel_booking
from app.db.models import Booking, Flight

# --- IST timestamp helper ---
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

def to_ist_iso(ts: str):
    if not ts:
        return ts
    try:
        dt = datetime.fromisoformat(ts)
        # if naive, assume UTC
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(IST).isoformat()
    except Exception:
        return ts


router = APIRouter(prefix="/api/v1/bookings", tags=["bookings"])


@router.post("/reserve", response_model=ReserveResponse)
def api_reserve(req: ReserveRequest, db: Session = Depends(get_db)):
    try:
        booking, price_snapshot, breakdown = reserve_seats(
            db, req.flight_id, req.seats, req.passenger_name, req.passenger_contact
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {
        "reservation_id": booking.id,
        "flight_id": booking.flight_id,
        "seats": booking.seats_booked,
        "price_snapshot": float(price_snapshot),
        # keep hold_expires_at in IST for user friendliness
        "hold_expires_at": to_ist_iso(booking.hold_expires_at)
    }


@router.post("/confirm", response_model=ConfirmResponse)
def api_confirm(req: ConfirmRequest, db: Session = Depends(get_db)):
    try:
        booking, status, breakdown = confirm_reservation(
            db, req.reservation_id, req.payment_success, req.payment_meta
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # include snapshot and timestamps for clarity (converted to IST)
    return {
        "booking_id": booking.id,
        "pnr": booking.pnr,
        "status": status,
        "price_paid": booking.price_paid,
        "price_snapshot": getattr(booking, "price_snapshot", None),
        "created_at": to_ist_iso(getattr(booking, "created_at", None)),
        "updated_at": to_ist_iso(getattr(booking, "updated_at", None)),
    }


@router.post("/cancel", response_model=CancelResponse)
def api_cancel(req: CancelRequest, db: Session = Depends(get_db)):
    """
    Cancel a booking by reservation_id or pnr.
    Optionally request a refund by setting refund=True and providing refund_meta.
    """
    try:
        b, result = cancel_booking(
            db,
            reservation_id=req.reservation_id,
            pnr=req.pnr,
            refund=bool(getattr(req, "refund", False)),
            refund_meta=getattr(req, "refund_meta", None)
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "booking_id": b.id,
        "status": result.get("status"),
        "refunded": result.get("refunded", False),
        "refund_amount": result.get("refund_amount"),
        "refund_meta": result.get("refund_meta")
    }


@router.get("/lookup/{pnr}", response_model=BookingOut)
def lookup_booking(pnr: str, db: Session = Depends(get_db)):
    """
    Lookup a booking by PNR and return BookingOut.
    Safely parse payment_meta (stored as TEXT) into a dict when possible.
    """
    b = db.query(Booking).filter(Booking.pnr == pnr).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Build a safe response dict (handle payment_meta string -> dict)
    resp = {
        "id": b.id,
        "flight_id": b.flight_id,
        "seats_booked": b.seats_booked,
        "price_paid": b.price_paid,
        "price_snapshot": getattr(b, "price_snapshot", None),
        "currency": getattr(b, "currency", None),
        "pnr": b.pnr,
        "status": b.status,
        "passenger_name": b.passenger_name,
        "passenger_contact": b.passenger_contact,
        # convert timestamps to IST before returning
        "hold_expires_at": to_ist_iso(b.hold_expires_at),
        "created_at": to_ist_iso(getattr(b, "created_at", None)),
        "updated_at": to_ist_iso(getattr(b, "updated_at", None)),
    }

    # payment_meta: stored as TEXT in DB. Try to parse JSON, otherwise return string or None.
    pm = getattr(b, "payment_meta", None)
    if pm is None or (isinstance(pm, str) and pm.strip() == ""):
        resp["payment_meta"] = None
    else:
        try:
            resp["payment_meta"] = json.loads(pm) if isinstance(pm, str) else pm
        except Exception:
            resp["payment_meta"] = pm

    # Return a validated Pydantic model instance
    return BookingOut(**resp)


@router.get("/list", response_model=List[BookingOut])
def list_bookings(
    flight_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List bookings with optional filters.
    """
    q = db.query(Booking)
    if flight_id is not None:
        q = q.filter(Booking.flight_id == flight_id)
    if status:
        q = q.filter(Booking.status == status)
    q = q.order_by(Booking.id.desc()).limit(limit).offset(offset)
    results: List[BookingOut] = []
    for b in q:
        # parse payment_meta safely
        try:
            pm = json.loads(b.payment_meta) if isinstance(b.payment_meta, str) and b.payment_meta.strip() else None
        except Exception:
            pm = b.payment_meta
        results.append(BookingOut(
            id=b.id,
            flight_id=b.flight_id,
            seats_booked=b.seats_booked,
            price_paid=b.price_paid,
            price_snapshot=getattr(b, "price_snapshot", None),
            currency=getattr(b, "currency", None),
            pnr=b.pnr,
            status=b.status,
            passenger_name=b.passenger_name,
            passenger_contact=b.passenger_contact,
            payment_meta=pm,
            # convert timestamps to IST
            hold_expires_at=to_ist_iso(b.hold_expires_at),
            created_at=to_ist_iso(getattr(b, "created_at", None)),
            updated_at=to_ist_iso(getattr(b, "updated_at", None))
        ))
    return results


@router.get("/receipt/{pnr}", response_model=ReceiptOut)
def receipt_by_pnr(pnr: str, db: Session = Depends(get_db)):
    """
    Return a simple receipt (booking + flight short details).
    """
    b = db.query(Booking).filter(Booking.pnr == pnr).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    f = db.get(Flight, b.flight_id)
    if not f:
        raise HTTPException(status_code=404, detail="Flight not found")

    # parse payment_meta
    try:
        pm = json.loads(b.payment_meta) if isinstance(b.payment_meta, str) and b.payment_meta.strip() else None
    except Exception:
        pm = b.payment_meta

    booking_out = BookingOut(
        id=b.id,
        flight_id=b.flight_id,
        seats_booked=b.seats_booked,
        price_paid=b.price_paid,
        price_snapshot=getattr(b, "price_snapshot", None),
        currency=getattr(b, "currency", None),
        pnr=b.pnr,
        status=b.status,
        passenger_name=b.passenger_name,
        passenger_contact=b.passenger_contact,
        payment_meta=pm,
        # convert timestamps to IST
        hold_expires_at=to_ist_iso(b.hold_expires_at),
        created_at=to_ist_iso(getattr(b, "created_at", None)),
        updated_at=to_ist_iso(getattr(b, "updated_at", None))
    )

    flight_short = FlightShort(
        id=f.id,
        flight_number=f.flight_number,
        origin=f.origin,
        destination=f.destination,
        departure_iso=f.departure_iso,
        arrival_iso=f.arrival_iso
    )

    receipt = ReceiptOut(
        booking=booking_out,
        flight=flight_short,
        total_paid=b.price_paid,
        currency=getattr(b, "currency", None),
        notes="This is a simulated receipt (no real payment processed)."
    )
    return receipt
