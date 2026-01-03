# app/api/v1/simulator.py
from fastapi import APIRouter
from app.services.simulator import start, stop, tick_once, status

# No prefix here — main.py already adds "/api/v1/simulator"
router = APIRouter(tags=["simulator"])

@router.post("/start")
def api_sim_start():
    start()
    return {"message": "Simulator started", "status": status()}

@router.post("/stop")
def api_sim_stop():
    stop()
    return {"message": "Simulator stopped", "status": status()}

@router.post("/tick")
def api_sim_tick():
    tick_once()
    return {"message": "Single tick executed", "status": status()}

@router.get("/status")
def api_sim_status():
    return status()
