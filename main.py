# main.py
from fastapi import FastAPI
from app.db import models
from app.db.base import engine

# create tables (safe)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Flight Search API - Milestone 1", version="1.0")


# import routers AFTER app and DB are defined — simple and safe
from app.api.v1.flights import router as flights_router
from app.api.v1.feeds import router as feeds_router

app.include_router(flights_router)
app.include_router(feeds_router)


@app.get("/health")
def health():
    return {"status": "ok"}
