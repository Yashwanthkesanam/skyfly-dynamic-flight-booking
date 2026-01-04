import smtplib
from email.mime.text import MIMEText
import os

# Credentials from email_service.py
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "Yashwanthece452@gmail.com"
SMTP_PASSWORD = "vsww cyen yufw rlpj"
SENDER_EMAIL = SMTP_USERNAME

TO_EMAIL = "Yashwanthece452@gmail.com" # Sending to self for test

def test_email():
    print(f"Testing SMTP Connection to {SMTP_SERVER}:{SMTP_PORT}...")
    try:
        msg = MIMEText("This is a test email from FlySmart backend debugger.")
        msg['Subject'] = "FlySmart SMTP Test"
        msg['From'] = SENDER_EMAIL
        msg['To'] = TO_EMAIL

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.set_debuglevel(1)
            print("1. EHLO")
            server.ehlo()
            print("2. STARTTLS")
            server.starttls()
            print("3. EHLO")
            server.ehlo()
            print(f"4. LOGIN as {SMTP_USERNAME}")
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            print("5. SEND_MESSAGE")
            server.send_message(msg)
            print("SUCCESS: Email sent!")

    except Exception as e:
        print(f"FAILURE: {e}")

if __name__ == "__main__":
    test_email()
