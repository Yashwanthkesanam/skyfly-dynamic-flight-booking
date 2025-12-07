import sys
import os

# Add parent dir to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal
from app.db.models import AdminUser
from app.core.security import get_password_hash

def create_admin(username, password):
    db = SessionLocal()
    try:
        user = db.query(AdminUser).filter(AdminUser.username == username).first()
        if user:
            print(f"User {username} already exists.")
            return
        
        hashed_pw = get_password_hash(password)
        new_admin = AdminUser(username=username, hashed_password=hashed_pw)
        db.add(new_admin)
        db.commit()
        print(f"Successfully created admin user: {username}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_admin.py <username> <password>")
        sys.exit(1)
    
    create_admin(sys.argv[1], sys.argv[2])
