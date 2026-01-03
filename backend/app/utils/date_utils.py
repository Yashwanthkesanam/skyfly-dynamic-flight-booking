from datetime import datetime

def normalize_date(date_str: str) -> str:
    """
    Accepts:
      - YYYY-MM-DD
      - DD-MM-YYYY
      - DD/MM/YYYY
      - DD.MM.YYYY

    Returns:
      - ISO YYYY-MM-DD
    """

    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%d.%m.%Y",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue

    raise ValueError(
        "Invalid date format. Allowed formats: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY"
    )
