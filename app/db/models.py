# app/db/models.py
from sqlalchemy import Column, Integer, String, Float, Text
from app.db.base import Base

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
    

