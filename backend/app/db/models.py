# app/db/models.py
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Index
from app.db.base import Base
from sqlalchemy.sql import func
from sqlalchemy import text as sa_text
from sqlalchemy.orm import relationship

class Flight(Base):
    __tablename__ = "flights"

    id = Column(Integer, primary_key=True, index=True)
    flight_number = Column(String, nullable=False, index=True)
    airline = Column(String, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_iso = Column(String, nullable=False)
    arrival_iso = Column(String, nullable=False)
    duration_min = Column(Integer, nullable=False)
    price_real = Column(Float, nullable=False)
    base_price = Column(Float, nullable=True)
    seats_total = Column(Integer, nullable=False)
    seats_available = Column(Integer, nullable=False)
    flight_date = Column(String, nullable=False)
    last_price_updated = Column(String, nullable=True)

class FareHistory(Base):
    __tablename__ = "fare_history"
    id = Column(Integer, primary_key=True, index=True)
    flight_id = Column(Integer, nullable=False)
    old_price = Column(Float)
    new_price = Column(Float, nullable=False)
    reason = Column(String, nullable=True)
    changed_at = Column(String, server_default=func.strftime('%Y-%m-%d %H:%M:%S', 'now'))

class DemandScore(Base):
    __tablename__ = "demand_scores"
    id = Column(Integer, primary_key=True, index=True)
    flight_id = Column(Integer, nullable=True)
    origin_code = Column(String, nullable=True)
    destination_code = Column(String, nullable=True)
    score = Column(Float, nullable=False, default=0.0)
    updated_at = Column(String, server_default=func.strftime('%Y-%m-%d %H:%M:%S', 'now'))

class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (Index("idx_bookings_status", "status"),)

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # FK to flights.id for referential integrity
    flight_id = Column(Integer, ForeignKey("flights.id", ondelete="CASCADE"), nullable=False, index=True)

    # DB default for seats (use server_default for DB-side default)
    seats_booked = Column(Integer, nullable=False, server_default=sa_text("1"))

    # NULL for reservation, filled only after confirm
    price_paid = Column(Float, nullable=True)

    # Store the quoted snapshot price at reserve time (used as final if present)
    price_snapshot = Column(Float, nullable=True)

    currency = Column(String, default="INR")
    passenger_name = Column(String, nullable=True)
    passenger_contact = Column(String, nullable=True)

    # Store JSON/string from payment gateway simulation
    payment_meta = Column(Text, nullable=True)

    # Filled after confirm; must be unique
    pnr = Column(String, nullable=True, unique=True, index=True)

    # reserved | confirmed | cancelled | expired
    status = Column(String, nullable=False, default="reserved")

    # ISO timestamp until hold expires
    hold_expires_at = Column(String, nullable=True)

    created_at = Column(
        String,
        server_default=func.strftime('%Y-%m-%d %H:%M:%S', 'now')
    )

    updated_at = Column(
        String,
        server_default=func.strftime('%Y-%m-%d %H:%M:%S', 'now')
    )

    # ORM relationship to Flight (convenience)
    flight = relationship("Flight", backref="bookings", lazy="joined")

