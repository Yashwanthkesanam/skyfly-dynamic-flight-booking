from datetime import datetime

def normalize_time(time_str: str) -> str:
    """
    Accepts:
      - 06:30
      - 6:30
      - 06:30 AM
      - 6:30 pm

    Returns:
      - 24-hour HH:MM
    """

    formats = [
        "%H:%M",
        "%I:%M %p",
        "%I:%M%p",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(time_str.upper(), fmt).strftime("%H:%M")
        except ValueError:
            continue

    raise ValueError("Invalid time format. Allowed: '06:30', '6:30', '06:30 AM', '6:30 PM'")
