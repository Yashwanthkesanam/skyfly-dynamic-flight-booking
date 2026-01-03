# app/api/v1/admin.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Dict
import csv
import io
from datetime import datetime
from app.api.deps import get_db
from app.db.models import Flight
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

class BulkUploadResponse(BaseModel):
    success: int
    failed: int
    errors: List[str]
    duplicates_updated: int

@router.post("/flights/bulk-upload", response_model=BulkUploadResponse)
async def bulk_upload_flights(
    file: UploadFile = File(...),
    update_duplicates: bool = False,
    db: Session = Depends(get_db)
):
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    # Read file content
    try:
        content = await file.read()
        csv_file = io.StringIO(content.decode('utf-8'))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Parse CSV
    try:
        reader = csv.DictReader(csv_file)
        
        # Validate headers
        required_fields = ['flight_number', 'airline', 'origin', 'destination', 
                          'departure_iso', 'arrival_iso', 'duration_min', 
                          'price_real', 'base_price', 'seats_total', 
                          'seats_available', 'flight_date']
        
        # Normalize headers (strip whitespace)
        reader.fieldnames = [f.strip() for f in reader.fieldnames] if reader.fieldnames else []
        
        if not all(field in reader.fieldnames for field in required_fields):
            missing = [f for f in required_fields if f not in reader.fieldnames]
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing)}"
            )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
    
    # Process rows
    success = 0
    failed = 0
    duplicates_updated = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
        try:
            # Validate required fields
            for field in required_fields:
                if not row.get(field) or not str(row[field]).strip():
                    raise ValueError(f"Missing or empty field: {field}")
            
            # Parse and validate data
            flight_number = row['flight_number'].strip().upper()
            airline = row['airline'].strip()
            origin = row['origin'].strip().upper()
            destination = row['destination'].strip().upper()
            departure_iso = row['departure_iso'].strip()
            arrival_iso = row['arrival_iso'].strip()
            flight_date = row['flight_date'].strip()
            
            # Numeric fields
            try:
                duration_min = int(row['duration_min'])
                price_real = float(row['price_real'])
                base_price = float(row['base_price'])
                seats_total = int(row['seats_total'])
                seats_available = int(row['seats_available'])
            except ValueError:
                raise ValueError("Invalid numeric format for duration, price, or seats")
            
            # Validate flight number format (2-3 letters + digits)
            import re
            if not re.match(r'^[A-Z]{2,3}\d+$', flight_number):
                raise ValueError(f"Invalid flight number format: {flight_number}")
            
            # Validate ISO dates
            try:
                datetime.fromisoformat(departure_iso)
                datetime.fromisoformat(arrival_iso)
                datetime.strptime(flight_date, '%Y-%m-%d')
            except ValueError:
                raise ValueError("Invalid date/time format. Use ISO format for times (YYYY-MM-DDTHH:MM:SS) and YYYY-MM-DD for date")

            # Check for duplicate (same flight number on same date)
            existing = db.query(Flight).filter(
                and_(
                    Flight.flight_number == flight_number,
                    Flight.flight_date == flight_date
                )
            ).first()
            
            if existing:
                if update_duplicates:
                    # Update existing flight
                    existing.airline = airline
                    existing.origin = origin
                    existing.destination = destination
                    existing.departure_iso = departure_iso
                    existing.arrival_iso = arrival_iso
                    existing.duration_min = duration_min
                    existing.price_real = price_real
                    existing.base_price = base_price
                    existing.seats_total = seats_total
                    existing.seats_available = seats_available
                    duplicates_updated += 1
                    success += 1
                else:
                    # Skip duplicate
                    errors.append(f"Row {row_num}: Duplicate flight {flight_number} on {flight_date} (skipped)")
                    failed += 1
                    continue
            else:
                # Create new flight
                new_flight = Flight(
                    flight_number=flight_number,
                    airline=airline,
                    origin=origin,
                    destination=destination,
                    departure_iso=departure_iso,
                    arrival_iso=arrival_iso,
                    duration_min=duration_min,
                    price_real=price_real,
                    base_price=base_price,
                    seats_total=seats_total,
                    seats_available=seats_available,
                    flight_date=flight_date
                )
                db.add(new_flight)
                success += 1
            
        except ValueError as e:
            failed += 1
            errors.append(f"Row {row_num}: {str(e)}")
        except Exception as e:
            failed += 1
            errors.append(f"Row {row_num}: Unexpected error - {str(e)}")
    
    # Commit all changes
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return BulkUploadResponse(
        success=success,
        failed=failed,
        errors=errors[:20],  # Return first 20 errors
        duplicates_updated=duplicates_updated
    )


@router.get("/flights/stats")
def get_flight_stats(db: Session = Depends(get_db)):
    """Get flight statistics for admin dashboard"""
    
    total_flights = db.query(Flight).count()
    
    # Count by airline
    from sqlalchemy import func
    airlines = db.query(
        Flight.airline,
        func.count(Flight.id).label('count')
    ).group_by(Flight.airline).all()
    
    return {
        "total_flights": total_flights,
        "airlines": [{"name": a[0], "count": a[1]} for a in airlines]
    }


@router.delete("/flights/{flight_id}")
def delete_flight(
    flight_id: int, 
    db: Session = Depends(get_db)
):
    """Delete a flight by ID"""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    db.delete(flight)
    db.commit()
    
    return {"message": "Flight deleted successfully"}
