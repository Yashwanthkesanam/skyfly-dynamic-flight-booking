# app/schemas/flight.py
from pydantic import BaseModel, Field, validator
from typing import Optional

class FlightBase(BaseModel):
    flight_number: str = Field(..., min_length=1)
    airline: str
    origin: str
    destination: str
    departure_iso: str
    arrival_iso: str
    duration_min: int
    price_real: float
    base_price: Optional[float] = None
    seats_total: int
    seats_available: int
    flight_date: str

    @validator('flight_date')
    def check_date_format(cls, v):
        import re
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("flight_date must be YYYY-MM-DD")
        return v

class FlightCreate(FlightBase):
    pass

class FlightUpdate(BaseModel):
    flight_number: Optional[str] = None
    airline: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    departure_iso: Optional[str] = None
    arrival_iso: Optional[str] = None
    duration_min: Optional[int] = None
    price_real: Optional[float] = None
    base_price: Optional[float] = None
    seats_total: Optional[int] = None
    seats_available: Optional[int] = None
    flight_date: Optional[str] = None

    @validator('flight_date')
    def check_date_format(cls, v):
        if v is None:
            return v
        import re
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("flight_date must be YYYY-MM-DD")
        return v

class FlightOut(FlightBase):
    id: Optional[int]

    class Config:
        orm_mode = True
