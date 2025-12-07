import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal
from app.db.models import AdminUser
from app.core.security import verify_password
from passlib.context import CryptContext

def test_login(username, password):
    db = SessionLocal()
    try:
        # Check if user exists
        user = db.query(AdminUser).filter(AdminUser.username == username).first()
        if not user:
            print(f"❌ User '{username}' NOT FOUND in database")
            print(f"   Database URL: {db.bind.url}")
            return False
            
        print(f"✅ User '{username}' FOUND")
        print(f"   Stored Hash: {user.hashed_password[:20]}...")
        
        # Test password verification
        is_valid = verify_password(password, user.hashed_password)
        if is_valid:
            print("✅ Password verification SUCCESS")
            return True
        else:
            print("❌ Password verification FAILED")
            print("   Debug info:")
            try:
                # Try to verify manually to see what scheme is being used
                pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
                print(f"   Identify hash: {pwd_context.identify(user.hashed_password)}")
            except Exception as e:
                print(f"   Error analyzing hash: {e}")
            return False
            
    finally:
        db.close()

if __name__ == "__main__":
    test_login("admin", "admin123")
