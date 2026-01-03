import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from main import app
    
    # Use ASCII checkmark/cross for safety on Windows consoles
    CHECK = "[OK]"
    CROSS = "[FAIL]"
    
    print(f"{CHECK} Successfully imported app from main.py")
    
    # Print all registered routes
    print("\nRegister Routes:")
    ws_found = False
    debug_found = False
    
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"  - {route.path}")
            if route.path == "/ws/feeds":
                ws_found = True
            if "ws-debug" in route.path:
                debug_found = True
                
    print("\n-----------------------------------")
    
    if ws_found:
        print(f"{CHECK} WebSocket route '/ws/feeds' IS registered!")
    else:
        print(f"{CROSS} WebSocket route '/ws/feeds' is NOT found.")
        
    if debug_found:
        print(f"{CHECK} Debug endpoint '/ws-debug' IS registered!")
    else:
        print(f"{CROSS} Debug endpoint '/ws-debug' is NOT found.")

except ImportError as e:
    print(f"{CROSS} Import Error: {e}")
except Exception as e:
    print(f"{CROSS} Error: {e}")
    import traceback
    traceback.print_exc()
