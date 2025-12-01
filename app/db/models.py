# app/db/models.py
from sqlalchemy import Column, Integer, String, Float, Text
from app.db.base import Base
from sqlalchemy.sql import func
class Flight(Base):
    __tablename__ = "flights"

    id = Column(Integer, primary_key=True, index=True)
    flight_number = Column(String, unique=True, nullable=False)
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
    id = Column(Integer, primary_key=True, index=True)
    flight_id = Column(Integer, nullable=False)
    seats_booked = Column(Integer, nullable=False)
    price_paid = Column(Float, nullable=False)
    created_at = Column(String, server_default=func.strftime('%Y-%m-%d %H:%M:%S', 'now'))

