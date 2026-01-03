# scripts/bulk_add_update_flights.py
"""
Bulk add or update flights from CSV using your app's SQLAlchemy models.

Usage (PowerShell):
  python scripts/bulk_add_update_flights.py --mode add --csv data/new_flights.csv --dry-run
  python scripts/bulk_add_update_flights.py --mode add --csv data/new_flights.csv

Modes:
  add    => INSERT new flights (skips existing flight_number)
  update => UPDATE existing flights matching flight_number
Options:
  --dry-run      => validate and parse only, do not commit
  --transactional=> commit all rows in single transaction (default: per-row commit)
  
"""
# make project root importable when running from scripts/ directory
import sys, os
proj_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # one level up from scripts/
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)
import csv
import argparse
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.exc import IntegrityError

# Ensure your app package is importable
from app.db.base import SessionLocal
from app.db.models import Flight

logger = logging.getLogger("bulk_flights")
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def parse_iso(dt_str: str) -> str:
    if not dt_str:
        raise ValueError("empty datetime")
    # try direct ISO parse
    try:
        return datetime.fromisoformat(dt_str).isoformat()
    except Exception:
        # try common fallback formats
        fmts = ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S")
        for f in fmts:
            try:
                return datetime.strptime(dt_str, f).isoformat()
            except Exception:
                pass
    raise ValueError(f"Invalid datetime format: {dt_str!r}")


def validate_row(row: dict, mode: str):
    # minimal required fields for add
    required = ["flight_number", "airline", "origin", "destination", "departure_iso", "arrival_iso",
                "duration_min", "price_real", "seats_total", "seats_available", "flight_date"]
    if mode == "add":
        for c in required:
            if c not in row or (row[c] is None) or str(row[c]).strip() == "":
                raise ValueError(f"Missing required column '{c}' in row: {row}")
    # validate ISO datetimes if present
    if row.get("departure_iso"):
        row["departure_iso"] = parse_iso(row["departure_iso"])
    if row.get("arrival_iso"):
        row["arrival_iso"] = parse_iso(row["arrival_iso"])
    return row


def add_from_csv(csv_path: str, dry_run: bool = False, transactional: bool = False):
    session = SessionLocal()
    with open(csv_path, newline='', encoding='utf8') as fh:
        reader = csv.DictReader(fh)
        rows = list(reader)

    logger.info("Parsed %d rows from %s", len(rows), csv_path)
    if dry_run:
        logger.info("Running dry-run: no DB changes will be committed")

    if transactional and not dry_run:
        # single transaction for all rows
        try:
            with session.begin():
                _process_add_rows(session, rows, dry_run=True)
            # commit handled by session.begin() context
            logger.info("Transactional import committed")
        except Exception as e:
            logger.error("Transactional import failed: %s", e)
            raise
        return

    # default: per-row commit (safer)
    _process_add_rows(session, rows, dry_run=dry_run)
    session.close()


def _process_add_rows(session, rows, dry_run=False):
    added = 0
    skipped = 0
    for idx, raw in enumerate(rows, start=1):
        try:
            row = validate_row(raw, mode="add")
        except Exception as e:
            logger.error("Row %d validation failed: %s", idx, e)
            continue

        # check duplicate flight_number
        fn = row["flight_number"]
        existing = session.query(Flight).filter(Flight.flight_number == fn).first()
        if existing:
            logger.warning("Row %d: SKIP existing flight_number=%s", idx, fn)
            skipped += 1
            continue

        f = Flight(
            flight_number=row["flight_number"],
            airline=row.get("airline") or "",
            origin=row.get("origin") or "",
            destination=row.get("destination") or "",
            departure_iso=row.get("departure_iso"),
            arrival_iso=row.get("arrival_iso"),
            duration_min=int(row.get("duration_min") or 0),
            price_real=float(row.get("price_real") or 0.0),
            base_price=float(row.get("base_price") or 0.0),
            seats_total=int(row.get("seats_total") or 0),
            seats_available=int(row.get("seats_available") or 0),
            flight_date=row.get("flight_date") or (row.get("departure_iso") or "").split("T")[0],
            last_price_updated=None
        )
        session.add(f)
        if not dry_run:
            try:
                session.commit()
                added += 1
                logger.info("Row %d: Added flight %s", idx, fn)
            except IntegrityError as ie:
                session.rollback()
                logger.error("Row %d: IntegrityError for %s: %s", idx, fn, ie)
            except Exception as ex:
                session.rollback()
                logger.error("Row %d: Error inserting %s: %s", idx, fn, ex)
        else:
            # dry-run: do not commit
            session.expunge(f)
            logger.info("Row %d: Validated (dry-run) %s", idx, fn)
    logger.info("Finished: added=%d skipped=%d", added, skipped)


def update_from_csv(csv_path: str, dry_run: bool = False):
    session = SessionLocal()
    with open(csv_path, newline='', encoding='utf8') as fh:
        reader = csv.DictReader(fh)
        rows = list(reader)

    updated = 0
    for idx, raw in enumerate(rows, start=1):
        key = raw.get("flight_number")
        if not key:
            logger.error("Row %d: missing flight_number, skipping", idx)
            continue
        f = session.query(Flight).filter(Flight.flight_number == key).first()
        if not f:
            logger.warning("Row %d: flight_number %s not found, skipping", idx, key)
            continue
        try:
            row = validate_row(raw, mode="update")
        except Exception as e:
            logger.error("Row %d validation failed: %s", idx, e)
            continue
        # apply updates if provided
        if row.get("departure_iso"):
            f.departure_iso = row["departure_iso"]
        if row.get("arrival_iso"):
            f.arrival_iso = row["arrival_iso"]
        if row.get("flight_date"):
            f.flight_date = row["flight_date"]
        if row.get("seats_total"):
            f.seats_total = int(row["seats_total"])
        if row.get("seats_available"):
            f.seats_available = int(row["seats_available"])
        if row.get("price_real"):
            f.price_real = float(row["price_real"])
        if not dry_run:
            session.add(f)
            session.commit()
            logger.info("Row %d: Updated %s", idx, key)
        else:
            logger.info("Row %d: Validated update (dry-run) %s", idx, key)
        updated += 1
    session.close()
    logger.info("Update finished, updated=%d", updated)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("add", "update"), required=True)
    parser.add_argument("--csv", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--transactional", action="store_true", help="commit all rows in a single transaction")
    args = parser.parse_args()

    if args.mode == "add":
        add_from_csv(args.csv, dry_run=args.dry_run, transactional=args.transactional)
    else:
        update_from_csv(args.csv, dry_run=args.dry_run)
