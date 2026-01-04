
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "yashwanthece452@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "acsbjycyijgvyfie")  # App Password (spaces removed)
SENDER_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USERNAME)
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://skyfly-dynamic-flight-booking.vercel.app")

# Email debug log file
EMAIL_LOG_FILE = "email_debug.log"

def log_email(msg):
    """Write email debug messages to both console and file"""
    print(msg)
    try:
        with open(EMAIL_LOG_FILE, "a", encoding="utf-8") as f:
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"[{timestamp}] {msg}\n")
    except:
        pass

def send_booking_email(booking, flight):
    """
    Sends a booking confirmation email to the passenger.
    """
    log_email(f"[EMAIL] send_booking_email called for booking: {getattr(booking, 'pnr', 'UNKNOWN')}")
    log_email(f"[EMAIL] Passenger contact: {getattr(booking, 'passenger_contact', 'NONE')}")
    
    if not booking.passenger_contact or "@" not in booking.passenger_contact:
        log_email(f"[EMAIL] SKIP: Invalid contact {booking.passenger_contact}")
        return False

    log_email(f"[EMAIL] Attempting to send email to {booking.passenger_contact}")
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        log_email("[EMAIL] SKIP: SMTP credentials not configured.")
        return False
    
    log_email(f"[EMAIL] SMTP configured: {SMTP_USERNAME}")

    try:
        subject = f"Booking Confirmed! PNR: {booking.pnr}"
        
        # Format dates
        dep_dt = datetime.fromisoformat(flight.departure_iso)
        arr_dt = datetime.fromisoformat(flight.arrival_iso)
        dep_time = dep_dt.strftime("%d %b %Y, %H:%M")
        arr_time = arr_dt.strftime("%d %b %Y, %H:%M")
        
        # Calculate duration roughly if not provided
        duration_seconds = (arr_dt - dep_dt).total_seconds()
        hours = int(duration_seconds // 3600)
        minutes = int((duration_seconds % 3600) // 60)
        duration_str = f"{hours}h {minutes}m"
        
        # HTML Content
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ background-color: #0f172a; padding: 25px; text-align: center; color: #ffffff; }}
                .header h1 {{ margin: 0; font-size: 24px; letter-spacing: 1px; }}
                .content {{ padding: 30px; }}
                .booking-summary {{ text-align: center; margin-bottom: 30px; }}
                .pnr-label {{ font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }}
                .pnr {{ font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: 4px; display: block; margin-top: 5px; }}
                
                .flight-card {{ border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; margin-bottom: 25px; }}
                .route {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }}
                .city {{ font-size: 18px; font-weight: bold; color: #0f172a; }}
                .time {{ font-size: 14px; color: #64748b; margin-top: 2px; }}
                .arrow {{ font-size: 20px; color: #cbd5e1; user-select: none; }}
                
                .details-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-top: 1px solid #e2e8f0; paddingTop: 15px; margin-top: 15px; font-size: 14px; }}
                .detail-item strong {{ display: block; color: #64748b; font-size: 11px; text-transform: uppercase; }}
                .detail-item span {{ color: #334155; font-weight: 600; }}
                
                .price-tag {{ background-color: #ecfdf5; border: 1px solid #10b981; color: #047857; padding: 10px; border-radius: 6px; text-align: center; margin-bottom: 25px; font-size: 16px; }}
                
                .actions {{ text-align: center; margin-top: 30px; }}
                .btn {{ background-color: #f97316; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block; }}
                .btn:hover {{ background-color: #ea580c; }}
                .link {{ display: block; margin-top: 15px; color: #3b82f6; text-decoration: none; font-size: 14px; }}
                
                .footer {{ background-color: #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; padding: 20px; border-top: 1px solid #e2e8f0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Booking Confirmed</h1>
                </div>
                <div class="content">
                    <p>Hi {booking.passenger_name},</p>
                    <p>Your flight to <strong>{flight.destination}</strong> is all set! Here are your booking details.</p>
                    
                    <div class="booking-summary">
                        <span class="pnr-label">Booking Reference (PNR)</span>
                        <span class="pnr">{booking.pnr}</span>
                    </div>
                    
                    <div class="flight-card">
                        <div class="route">
                            <div class="left">
                                <div class="city">{flight.origin}</div>
                                <div class="time">{dep_time}</div>
                            </div>
                            <div class="arrow">✈</div>
                            <div class="right" style="text-align: right;">
                                <div class="city">{flight.destination}</div>
                                <div class="time">{arr_time}</div>
                            </div>
                        </div>
                        
                        <div class="details-grid">
                            <div class="detail-item">
                                <strong>Airline</strong>
                                <span>{flight.airline}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Flight No</strong>
                                <span>{flight.flight_number}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Class</strong>
                                <span>Economy</span>
                            </div>
                             <div class="detail-item">
                                <strong>Duration</strong>
                                <span>{duration_str}</span>
                            </div>
                             <div class="detail-item">
                                <strong>Seats</strong>
                                <span>{booking.seats_booked} Passenger(s)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="price-tag">
                        <strong>Total Paid: ₹{booking.price_paid:,.2f}</strong>
                    </div>
                    
                    <div class="actions">
                        <a href="{FRONTEND_URL}/bookings" class="btn">View My Booking</a>
                        <a href="{FRONTEND_URL}" class="link">Visit FlySmart Website</a>
                    </div>
                    
                    <p style="font-size: 13px; color: #666; margin-top: 30px;">
                        <strong>Important:</strong> Please carry a valid government-issued ID card and a copy of this ticket (digital or print) for entry into the airport.
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 FlySmart. All rights reserved.</p>
                    <p>Need help? Contact us at support@flysmart.com</p>
                </div>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = booking.passenger_contact
        msg['Subject'] = subject

        msg.attach(MIMEText(html_content, 'html'))

        log_email(f"[EMAIL] Connecting to {SMTP_SERVER}:{SMTP_PORT} as {SMTP_USERNAME}")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.set_debuglevel(0)  # Disable verbose SMTP debugging for cleaner logs
            log_email("[EMAIL] Starting TLS...")
            server.starttls()
            log_email("[EMAIL] Logging in...")
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            log_email("[EMAIL] Sending message...")
            server.send_message(msg)
        
        log_email(f"[EMAIL] SUCCESS: Email sent to {booking.passenger_contact}")
        return True

    except Exception as e:
        log_email(f"[EMAIL] FAILURE: {e}")
        import traceback
        traceback.print_exc()
        return False
