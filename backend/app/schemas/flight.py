# app/schemas/flight.py
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict
from datetime import datetime

DATE_INPUT_FORMATS = ["%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y"]

def _parse_and_normalize_date(s: str) -> str:
    """
    Accept several common date formats and return ISO date 'YYYY-MM-DD'.
    Raise ValueError if parsing fails.
    """
    if s is None:
        raise ValueError("date is None")
    s = s.strip()
    for fmt in DATE_INPUT_FORMATS:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            continue
    raise ValueError(
        "flight_date must be in one of: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, or DD.MM.YYYY"
    )

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

    @validator("flight_date", pre=True, always=True)
    def normalize_flight_date(cls, v):
        # Normalize user input to YYYY-MM-DD
        if v is None:
            raise ValueError("flight_date is required")
        return _parse_and_normalize_date(v)

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

    @validator("flight_date", pre=True)
    def normalize_optional_date(cls, v):
        if v is None:
            return v
        return _parse_and_normalize_date(v)

class FlightOut(FlightBase):
    id: Optional[int]

    class Config:
        orm_mode = True

class FlightOutWithDynamic(FlightOut):
    """
    Extended output model for Milestone 2 dynamic pricing.
    All dynamic fields are optional for backward compatibility.
    """
    dynamic_price: Optional[float] = None
    price_increase_percent: Optional[float] = None
    demand_score: Optional[float] = None
    price_breakdown: Optional[Dict[str, float]] = None
