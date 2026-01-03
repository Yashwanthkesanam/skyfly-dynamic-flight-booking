# app/api/v1/pricing.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.db import models

router = APIRouter(tags=["pricing"])

@router.get("/fare_history/{flight_id}")
def fare_history(flight_id: int, limit: int = Query(20, ge=1, le=500), db: Session = Depends(get_db)):
    rows = db.query(models.FareHistory).filter(models.FareHistory.flight_id == flight_id).order_by(models.FareHistory.id.desc()).limit(limit).all()
    return [{"id": r.id, "old": r.old_price, "new": r.new_price, "reason": r.reason, "ts": r.changed_at} for r in rows]

@router.get("/demand/{flight_id}")
def demand_score(flight_id: int, db: Session = Depends(get_db)):
    row = db.query(models.DemandScore).filter(models.DemandScore.flight_id == flight_id).first()
    if not row:
        # Return default neutral score instead of 404 to avoid console errors
        return {"flight_id": flight_id, "score": 0.0, "updated_at": None}
    return {"flight_id": row.flight_id, "score": row.score, "updated_at": row.updated_at}
