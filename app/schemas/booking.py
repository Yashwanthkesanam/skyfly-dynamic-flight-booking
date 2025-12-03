# app/schemas/booking.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, List

class ReserveRequest(BaseModel):
    flight_id: int
    seats: int = Field(..., ge=1)
    passenger_name: Optional[str] = None
    passenger_contact: Optional[str] = None

class ReserveResponse(BaseModel):
    reservation_id: int
    flight_id: int
    seats: int
    price_snapshot: float
    hold_expires_at: str  # ISO

class ConfirmRequest(BaseModel):
    reservation_id: int
    payment_success: bool = True
    payment_meta: Optional[Dict] = None

class ConfirmResponse(BaseModel):
    booking_id: int
    pnr: Optional[str]
    status: str
    price_paid: Optional[float]
    # optional: include snapshot used and timestamps for frontend clarity
    price_snapshot: Optional[float] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CancelRequest(BaseModel):
    reservation_id: Optional[int] = None
    pnr: Optional[str] = None
    # request a refund simulation when cancelling confirmed bookings
    refund: Optional[bool] = False
    refund_meta: Optional[Dict] = None

class CancelResponse(BaseModel):
    booking_id: int
    status: str
    refunded: Optional[bool] = False
    refund_amount: Optional[float] = None
    refund_meta: Optional[Dict] = None

class BookingOut(BaseModel):
    id: int
    flight_id: int
    seats_booked: int
    price_paid: Optional[float]
    price_snapshot: Optional[float] = None
    currency: Optional[str] = None
    pnr: Optional[str]
    status: str
    passenger_name: Optional[str]
    passenger_contact: Optional[str]
    payment_meta: Optional[Dict] = None
    hold_expires_at: Optional[str]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        orm_mode = True

class FlightShort(BaseModel):
    id: int
    flight_number: str
    origin: str
    destination: str
    departure_iso: str
    arrival_iso: str

class ReceiptOut(BaseModel):
    booking: BookingOut
    flight: FlightShort
    total_paid: Optional[float]
    currency: Optional[str]
    notes: Optional[str] = None
