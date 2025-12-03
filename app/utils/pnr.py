# app/utils/pnr.py
import string
import secrets
from typing import Callable, Optional

def _random_pnr(length: int = 6) -> str:
    """
    Generate a random PNR using uppercase letters and digits.
    Uses `secrets.choice` for higher safety.
    """
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_pnr_unique(
    check_fn: Callable[[str], bool],
    length: int = 6,
    attempts: int = 10,
    prefix: Optional[str] = None
) -> str:
    """
    Generate a unique PNR string.
    
    Args:
        check_fn: function that returns True if PNR already exists in DB.
        length: number of characters (excluding prefix).
        attempts: maximum attempts before failing.
        prefix: optional PNR prefix (like airline code "AI", "6E").

    Returns:
        unique PNR string.

    Raises:
        ValueError: if unable to generate a unique PNR within attempts.
    """
    if length <= 0:
        raise ValueError("PNR length must be >= 1")

    if prefix:
        # ensure prefix is uppercase
        prefix = str(prefix).upper().strip()
    else:
        prefix = ""

    for _ in range(attempts):
        p_base = _random_pnr(length)
        p = prefix + p_base

        try:
            exists = check_fn(p)
        except Exception:
            # if DB check fails, retry safely
            continue

        if not exists:
            return p

    raise ValueError("Failed to generate unique PNR after multiple attempts")
