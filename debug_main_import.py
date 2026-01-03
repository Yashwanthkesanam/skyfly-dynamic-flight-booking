import sys
import os
import traceback

# Add current directory to path
sys.path.append(os.getcwd())

print(f"Current Directory: {os.getcwd()}")
print(f"Python Path: {sys.path}")

print("\n-----------------------------------")
print("Attempting to import app.main...")
print("-----------------------------------\n")

try:
    import app.main
    print("\n✅ Import SUCCESSFUL")
except Exception as e:
    print("\n❌ Import FAILED")
    print(f"Error: {e}")
    print("\nTraceback:")
    traceback.print_exc()
