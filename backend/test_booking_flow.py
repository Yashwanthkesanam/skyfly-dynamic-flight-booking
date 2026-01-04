import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def make_request(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    
    if data:
        jsondata = json.dumps(data).encode('utf-8')
        req.data = jsondata

    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        return None
    except Exception as e:
        print(f"Request Error: {e}")
        return None

def test_booking_flow():
    # 1. Search (Search logic might be complex with GET params in urllib, using list flight instead)
    print("1. getting flight list...")
    flights = make_request(f"{BASE_URL}/flights")
        
    if not flights:
        print("No flights found to book.")
        return

    flight = flights[0]
    flight_id = flight['id']
    print(f"   Selected flight: {flight['origin']} -> {flight['destination']} (ID: {flight_id})")

    # 2. Reserve
    print("\n2. Reserving seats...")
    payload = {
        "flight_id": flight_id,
        "seats": 1,
        "passenger_name": "Test Passenger",
        "passenger_contact": "Yashwanthece452@gmail.com"
    }
    data = make_request(f"{BASE_URL}/bookings/reserve", method="POST", data=payload)
    
    if not data:
        print("Reservation failed.")
        return

    reservation_id = data['reservation_id']
    print(f"   Reservation ID: {reservation_id}")

    # 3. Confirm
    print("\n3. Confirming booking...")
    confirm_payload = {
        "reservation_id": reservation_id,
        "payment_success": True,
        "payment_meta": {"method": "test_script", "transaction_id": "TEST_TXN_123"}
    }
    resp = make_request(f"{BASE_URL}/bookings/confirm", method="POST", data=confirm_payload)
    
    if resp:
        print("✅ Booking CONFIRMED!")
        print("   Check backend console logs for: [DEBUG: Queueing email task...]")
    else:
        print("❌ Confirmation failed.")

if __name__ == "__main__":
    test_booking_flow()
