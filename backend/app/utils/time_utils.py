from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import pytz

def human_time_ist(dt_value):
    """
    Convert ISO or datetime into clean IST human-readable time.
    
    Args:
        dt_value: datetime object or ISO string
        
    Returns:
        Formatted IST string like "01-Dec-2024 09:00 PM" or original string if error
    """
    if not dt_value:
        return None
    
    try:
        # Convert string to datetime if needed
        if isinstance(dt_value, str):
            # Handle various ISO formats
            dt_str = dt_value.replace("Z", "+00:00")
            if "T" in dt_str:
                # ISO format with date and time
                dt_obj = datetime.fromisoformat(dt_str)
            else:
                # Just time or just date - parse differently
                dt_obj = datetime.strptime(dt_str, "%Y-%m-%d") if "-" in dt_str else datetime.strptime(dt_str, "%H:%M:%S")
        else:
            dt_obj = dt_value
        
        # Ensure datetime has timezone info
        if dt_obj.tzinfo is None:
            dt_obj = dt_obj.replace(tzinfo=timezone.utc)
        
        # Convert to IST using best available method
        try:
            ist_tz = ZoneInfo("Asia/Kolkata")
        except:
            ist_tz = pytz.timezone("Asia/Kolkata")
        
        dt_ist = dt_obj.astimezone(ist_tz)
        
        # Format: "01-Dec-2024 09:00 PM"
        return dt_ist.strftime("%d-%b-%Y %I:%M %p")
        
    except Exception:
        # Return original value as string if conversion fails
        return str(dt_value)


def normalize_time(time_str: str) -> str:
    """
    Normalize various time formats to 24-hour HH:MM format.
    
    Args:
        time_str: Time in formats like "06:30", "6:30", "06:30 AM", "6:30 PM"
        
    Returns:
        24-hour format like "18:30"
        
    Raises:
        ValueError: If time format is invalid
    """
    if not time_str or not isinstance(time_str, str):
        raise ValueError("Time must be a non-empty string")
    
    time_str = time_str.strip().upper()
    
    # Handle special cases
    if time_str == "12 AM" or time_str == "12:00 AM":
        return "00:00"
    elif time_str == "12 PM" or time_str == "12:00 PM":
        return "12:00"
    
    # Try parsing with different formats
    formats_to_try = [
        "%H:%M",        # 24-hour (14:30)
        "%H",           # 24-hour hour only (14)
        "%I:%M %p",     # 12-hour with space (02:30 PM)
        "%I:%M%p",      # 12-hour without space (02:30PM)
        "%I %p",        # 12-hour hour only (2 PM)
    ]
    
    for fmt in formats_to_try:
        try:
            # For hour-only formats, add minutes
            if fmt in ["%H", "%I %p"]:
                time_str_with_minutes = time_str + ":00" if ":" not in time_str else time_str
                dt = datetime.strptime(time_str_with_minutes, fmt.replace("%H", "%H:%M").replace("%I %p", "%I:00 %p"))
            else:
                dt = datetime.strptime(time_str, fmt)
            
            return dt.strftime("%H:%M")
        except ValueError:
            continue
    
    # If all formats fail, try more flexible parsing
    try:
        # Remove any non-digit, non-colon, non-AM/PM characters
        cleaned = ''.join(c for c in time_str if c.isdigit() or c in [':', 'A', 'P', 'M', ' '])
        cleaned = cleaned.strip()
        
        # Try to guess format
        if 'AM' in cleaned or 'PM' in cleaned:
            # Has AM/PM marker
            time_part = cleaned.replace('AM', '').replace('PM', '').strip()
            if ':' in time_part:
                hour, minute = time_part.split(':')
            else:
                hour, minute = time_part, '00'
            
            hour = int(hour)
            minute = int(minute) if minute else 0
            
            # Adjust for PM
            if 'PM' in cleaned and hour != 12:
                hour += 12
            elif 'AM' in cleaned and hour == 12:
                hour = 0
            
            return f"{hour:02d}:{minute:02d}"
        else:
            # No AM/PM, assume 24-hour
            if ':' in cleaned:
                hour, minute = cleaned.split(':')
                return f"{int(hour):02d}:{int(minute):02d}"
            else:
                return f"{int(cleaned):02d}:00"
                
    except Exception as e:
        raise ValueError(
            f"Invalid time format: '{time_str}'. "
            f"Expected formats: '14:30', '2:30 PM', '2 PM', or '06:30'"
        ) from e


def get_ist_time():
    """
    Get current Indian Standard Time safely with multiple fallbacks.
    
    Returns:
        Current datetime in IST timezone
    """
    current_utc = datetime.now(timezone.utc)
    
    # Try different methods in order of preference
    try:
        # Method 1: Using zoneinfo (Python 3.9+ - most accurate)
        return current_utc.astimezone(ZoneInfo("Asia/Kolkata"))
    except Exception:
        try:
            # Method 2: Using pytz (for older Python)
            return current_utc.astimezone(pytz.timezone('Asia/Kolkata'))
        except Exception:
            # Method 3: Manual offset (fallback)
            return current_utc + timedelta(hours=5, minutes=30)


def is_valid_time_format(time_str: str) -> bool:
    """
    Check if a time string is in a valid format.
    
    Args:
        time_str: Time string to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        normalize_time(time_str)
        return True
    except ValueError:
        return False


def get_ist_now_str() -> str:
    """
    Get current IST time as formatted string.
    
    Returns:
        Current IST time as "01-Dec-2024 09:00 PM"
    """
    return human_time_ist(get_ist_time())


def time_difference_minutes(time1: str, time2: str) -> int:
    """
    Calculate difference between two times in minutes.
    
    Args:
        time1, time2: Time strings in any valid format
        
    Returns:
        Difference in minutes (positive if time1 > time2)
    """
    t1 = normalize_time(time1)
    t2 = normalize_time(time2)
    
    dt1 = datetime.strptime(t1, "%H:%M")
    dt2 = datetime.strptime(t2, "%H:%M")
    
    diff = dt1 - dt2
    return int(diff.total_seconds() // 60)


# Example usage
if __name__ == "__main__":
    print("=== Testing Time Functions ===")
    
    # Test human_time_ist
    print("\n1. Testing human_time_ist:")
    print(f"UTC to IST: {human_time_ist('2024-12-25T14:30:00Z')}")
    print(f"Now in IST: {human_time_ist(datetime.now())}")
    
    # Test normalize_time
    print("\n2. Testing normalize_time:")
    test_times = ["6:30 PM", "06:30", "14:45", "2 PM", "12 AM", "12 PM"]
    for t in test_times:
        try:
            normalized = normalize_time(t)
            print(f"  '{t}' -> '{normalized}'")
        except ValueError as e:
            print(f"  '{t}' -> ERROR: {e}")
    
    # Test get_ist_time
    print("\n3. Current IST time:")
    print(f"  Datetime: {get_ist_time()}")
    print(f"  Formatted: {get_ist_now_str()}")
    
    # Test time difference
    print("\n4. Time difference:")
    print(f"  '14:00' to '16:30' = {time_difference_minutes('14:00', '16:30')} minutes")
    print(f"  '9 AM' to '2 PM' = {time_difference_minutes('9 AM', '2 PM')} minutes")
    
    print("\n=== All tests complete ===")