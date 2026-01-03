import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Default to local SQLite if env var not set (development mode)
# In Docker, we will set DATABASE_URL to point to a volume or external DB
DB_URL = os.environ.get("DATABASE_URL", "sqlite:///./flights_new.db")

engine = create_engine(DB_URL, connect_args={"check_same_thread": False}, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()
