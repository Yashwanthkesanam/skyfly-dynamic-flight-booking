def normalize_city(city: str) -> str:
    """
    Clean city names:
      - Remove spaces
      - Convert to proper title case
      - Fix common abbreviations
    """
    if not city:
        return city

    city = city.strip().lower()

    # Common shortcuts
    replacements = {
        "hyd": "Hyderabad",
        "blr": "Bengaluru",
        "del": "Delhi",
        "bom": "Mumbai",
        "maa": "Chennai",
    }

    if city in replacements:
        return replacements[city]

    return city.title()
