# main.py
from fastapi import FastAPI
from app.db import models
from app.db.base import engine
import importlib
import traceback

# ----------------------------------------------------
# DATABASE: Create tables (safe for SQLite)
# ----------------------------------------------------
models.Base.metadata.create_all(bind=engine)

# ----------------------------------------------------
# APP INSTANCE
# ----------------------------------------------------
app = FastAPI(
    title="SkyFly Dynamic Flight Booking",
    version="2.0",
    description="Advanced flight search + dynamic pricing engine (Milestone 1 & 2)"
)

# ----------------------------------------------------
# CORS (important for frontend integration later)
# Use FastAPI / Starlette API to register middleware.
# Do NOT mutate app.user_middleware directly.
# ----------------------------------------------------
from starlette.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         # change to specific origins for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# REQUIRED ROUTERS (fail early if missing)
# ----------------------------------------------------
from app.api.v1.flights import router as flights_router
from app.api.v1.feeds import router as feeds_router

app.include_router(flights_router)
app.include_router(feeds_router)

# ----------------------------------------------------
# BOOKING ROUTER (Milestone 3) - include if present
# ----------------------------------------------------
try:
    from app.api.v1.bookings import router as bookings_router
    app.include_router(bookings_router)  # bookings_router already has its own prefix
    print("Included bookings router (app.api.v1.bookings).")
except Exception as e:
    print("Bookings router not included —", e)

# ----------------------------------------------------
# OPTIONAL: pricing router (Milestone 2)
# ----------------------------------------------------
try:
    pricing_mod = importlib.import_module("app.api.v1.pricing")
    if hasattr(pricing_mod, "router"):
        app.include_router(pricing_mod.router, prefix="/api/v1")
        print("Included pricing router (app.api.v1.pricing).")
except Exception as e:
    print("Pricing router not included —", e)

# ----------------------------------------------------
# OPTIONAL: simulator API & background service
# ----------------------------------------------------
_simulator_api_included = False
try:
    sim_api_mod = importlib.import_module("app.api.v1.simulator")
    if hasattr(sim_api_mod, "router"):
        app.include_router(sim_api_mod.router, prefix="/api/v1/simulator")
        _simulator_api_included = True
        print("Included simulator API router (app.api.v1.simulator).")
except Exception:
    # simulator API is optional; continue silently
    pass

# Import simulator service (start/stop/tick/status)
_simulator = None
try:
    from app.services import simulator as simulator_service
    _simulator = simulator_service
    print("Simulator service imported (app.services.simulator).")
except Exception as e:
    print("Simulator service not available —", e)

# ----------------------------------------------------
# STARTUP / SHUTDOWN HOOKS
# ----------------------------------------------------
@app.on_event("startup")
def startup_event():
    # Start simulator background thread if available
    try:
        if _simulator and callable(getattr(_simulator, "start", None)):
            _simulator.start()
            status = _simulator.status() if callable(getattr(_simulator, "status", None)) else {}
            print("✅ Simulator started:", status)
        else:
            print("Simulator not configured; skipping auto-start.")
    except Exception as e:
        print("Simulator failed to start:", e)
        traceback.print_exc()

    print("SkyFly API started. Ready to accept requests.")


@app.on_event("shutdown")
def shutdown_event():
    try:
        if _simulator and callable(getattr(_simulator, "stop", None)):
            _simulator.stop()
            print("✅ Simulator stop requested.")
    except Exception as e:
        print("Simulator stop failed:", e)
        traceback.print_exc()

    print("SkyFly API shutting down.")


# ----------------------------------------------------
# HEALTH CHECK
# ----------------------------------------------------
@app.get("/health")
def health():
    info = {"status": "ok", "service": "SkyFly API running", "milestones": ["M1", "M2", "M3"]}
    if _simulator and callable(getattr(_simulator, "status", None)):
        try:
            info["simulator"] = _simulator.status()
        except Exception:
            info["simulator"] = {"error": "failed to read simulator status"}
    return info
