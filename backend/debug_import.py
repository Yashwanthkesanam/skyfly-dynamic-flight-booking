import sys
import os
import traceback

sys.path.append(os.getcwd())

print("Attempting to import app.api.v1.websocket...")

try:
    import app.api.v1.websocket
    print("✅ Import SUCCESSFUL")
except Exception:
    print("❌ Import FAILED")
    traceback.print_exc()
