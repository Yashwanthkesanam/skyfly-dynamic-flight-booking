# main.py - SkyFly API (clean, production-ready)
import os
import importlib
import logging
import traceback
import time
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.db import models
from app.db.base import engine

# ----------------------------------------------------
# CONFIG
# ----------------------------------------------------
DEBUG = os.environ.get("SKYFLY_DEBUG", "0") in ("1", "true", "True")
LOG_LEVEL = logging.DEBUG if DEBUG else logging.INFO

# ----------------------------------------------------
# LOGGING
# ----------------------------------------------------
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("skyfly")
requests_logger = logging.getLogger("skyfly.requests")

# ----------------------------------------------------
# DATABASE INIT (idempotent)
# ----------------------------------------------------
models.Base.metadata.create_all(bind=engine)

# ----------------------------------------------------
# APP
# ----------------------------------------------------
app = FastAPI(
    title="SkyFly Dynamic Flight Booking",
    version="2.0",
    description="Advanced flight search + dynamic pricing engine (M1, M2, M3)",
)

# ----------------------------------------------------
# REQUEST LOGGING MIDDLEWARE (concise, consistent)
# ----------------------------------------------------
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
        status = response.status_code
    except Exception as exc:
        status = 500
        # log exception details here so the server logs contain stack traces
        logger.exception("Unhandled exception while processing request")
        raise
    finally:
        duration_ms = (time.time() - start) * 1000.0
        client = request.client.host if request.client else "unknown"
        requests_logger.info(
            '%s "%s %s" %d %.1fms',
            client,
            request.method,
            request.url.path,
            status,
            duration_ms,
        )
    return response

# ----------------------------------------------------
# CORS (for frontend during dev)
# ----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# ROUTERS (include where available; log on failure)
# ----------------------------------------------------
def safe_include(module_path: str, router_attr: str = "router", prefix: Optional[str] = None):
    try:
        mod = importlib.import_module(module_path)
        router = getattr(mod, router_attr, None)
        if router is None:
            logger.warning("Module %s does not expose '%s' (skipping)", module_path, router_attr)
            return False
        if prefix:
            app.include_router(router, prefix=prefix)
            logger.info("Included router %s with prefix=%s", module_path, prefix)
        else:
            app.include_router(router)
            logger.info("Included router %s", module_path)
        return True
    except Exception as e:
        logger.warning("Failed to include router %s: %s", module_path, getattr(e, "args", e))
        if DEBUG:
            logger.debug(traceback.format_exc())
        return False

# Core routers (required)
safe_include("app.api.v1.admin")
safe_include("app.api.v1.flights")
safe_include("app.api.v1.feeds")

# Optional routers
safe_include("app.api.v1.bookings")                        # bookings (M3)
safe_include("app.api.v1.pricing", prefix="/api/v1")      # pricing service
safe_include("app.api.v1.simulator", prefix="/api/v1/simulator")  # simulator API

# ----------------------------------------------------
# SIMULATOR SERVICE (optional background component)
# ----------------------------------------------------
_simulator = None
try:
    from app.services import simulator as simulator_service  # type: ignore
    _simulator = simulator_service
    logger.info("Simulator service module imported.")
except Exception as e:
    logger.info("Simulator service not available (optional): %s", getattr(e, "args", e))
    if DEBUG:
        logger.debug(traceback.format_exc())

# ----------------------------------------------------
# LIFECYCLE HOOKS
# ----------------------------------------------------
import asyncio
from app.utils.websocket_manager import manager

@app.on_event("startup")
def on_startup():
    logger.info("SkyFly API startup initiated.")
    
    # Initialize WebSocket manager with main loop for thread-safe broadcasting
    try:
        loop = asyncio.get_running_loop()
        manager.set_loop(loop)
    except Exception as e:
        logger.error(f"Failed to capture event loop for WebSocket manager: {e}")

    # SIMULATOR AUTO-START DISABLED (Manual start via /admin only)
    # if _simulator and callable(getattr(_simulator, "start", None)):
    #     try:
    #         _simulator.start()
    #         status = _simulator.status() if callable(getattr(_simulator, "status", None)) else {}
    #         logger.info("Simulator started: %s", status)
    #     except Exception:
    #         logger.exception("Failed to start simulator")
    logger.info("SkyFly API started and ready.")

@app.on_event("shutdown")
def on_shutdown():
    logger.info("SkyFly API shutdown initiated.")
    if _simulator and callable(getattr(_simulator, "stop", None)):
        try:
            _simulator.stop()
            logger.info("Simulator stop requested.")
        except Exception:
            logger.exception("Failed to stop simulator")
    logger.info("SkyFly API shutdown complete.")

# ----------------------------------------------------
# HEALTH CHECK
# ----------------------------------------------------
@app.get("/health")
def health():
    payload = {
        "status": "ok",
        "service": "SkyFly API",
        "milestones": ["M1", "M2", "M3"],
    }
    try:
        if _simulator and callable(getattr(_simulator, "status", None)):
            payload["simulator"] = _simulator.status()
    except Exception:
        payload["simulator"] = {"error": "failed to read simulator status"}
    return payload