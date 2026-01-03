# app/utils/price_utils.py
from datetime import datetime, timezone
from typing import Optional, Union
from zoneinfo import ZoneInfo

# -------------------------------
# Human-friendly IST time helpers
# -------------------------------
def _parse_iso_to_dt(iso_or_dt: Union[str, datetime]) -> Optional[datetime]:
    """
    Accept either an ISO string or a datetime and return an aware datetime in UTC.
    Returns None on parse failure.
    """
    if not iso_or_dt:
        return None

    if isinstance(iso_or_dt, datetime):
        dt = iso_or_dt
        # assume naive datetimes are UTC (caller should pass tz-aware if possible)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    # string case
    try:
        # handle common ISO variants, including trailing 'Z'
        s = str(iso_or_dt).strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def human_time(ts_iso: Optional[Union[str, datetime]]) -> Optional[str]:
    """
    Convert UTC ISO/datetime -> human-friendly IST string.
    Example: "01-Dec-2025 11:05:55 AM IST"
    Returns None if input is falsy.
    """
    dt = _parse_iso_to_dt(ts_iso)
    if not dt:
        return None
    try:
        dt_ist = dt.astimezone(ZoneInfo("Asia/Kolkata"))
        return dt_ist.strftime("%d-%b-%Y %I:%M:%S %p IST")
    except Exception:
        # fallback to UTC iso if ZoneInfo fails
        return dt.isoformat()


def iso_to_ist(iso_str: Optional[Union[str, datetime]]) -> Optional[str]:
    """
    Convert an ISO string or datetime to a concise IST string used in UI:
    e.g. "01-Dec-2025 09:00 PM IST".
    """
    dt = _parse_iso_to_dt(iso_str)
    if not dt:
        return None
    try:
        dt_ist = dt.astimezone(ZoneInfo("Asia/Kolkata"))
        return dt_ist.strftime("%d-%b-%Y %I:%M %p IST")
    except Exception:
        return dt.isoformat()


# -------------------------------
# Cooldown Settings
# -------------------------------
DEFAULT_MIN_UPDATE_SECONDS = 300  # 5 minutes


# -------------------------------
# Current UTC time (ISO)
# -------------------------------
def now_utc_iso() -> str:
    """Return current UTC time in ISO format with timezone."""
    return datetime.now(timezone.utc).isoformat()


# -------------------------------
# Time difference helper
# -------------------------------
def seconds_since_iso(ts_iso: Optional[Union[str, datetime]]) -> float:
    """
    Return seconds passed since the timestamp.
    If missing/invalid → return +inf so that should_update_price() returns True (allow update).
    Accepts either ISO string or datetime.
    """
    dt = _parse_iso_to_dt(ts_iso)
    if not dt:
        return float("inf")

    try:
        now = datetime.now(timezone.utc)
        delta = now - dt
        return delta.total_seconds()
    except Exception:
        return float("inf")


# -------------------------------
# Cooldown checker
# -------------------------------
def should_update_price(last_price_updated_iso: Optional[Union[str, datetime]],
                        min_update_seconds: int = DEFAULT_MIN_UPDATE_SECONDS) -> bool:
    """
    True  => allowed to update the price.
    False => cooldown active (not enough time elapsed since last update).
    """
    return seconds_since_iso(last_price_updated_iso) >= min_update_seconds
