# app/api/v1/websocket.py
"""
WebSocket endpoint for real-time flight updates.
Clients connect to /ws/feeds to receive live price and seat updates.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.utils.websocket_manager import manager
import logging
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/ws-debug")
def ws_debug():
    """Debug endpoint to check if websocket router is loaded"""
    return {"status": "ok", "message": "WebSocket router is mounted"}

@router.websocket("/ws/feeds")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time flight updates.
    
    Clients will receive JSON messages with flight updates:
    {
        "type": "flight_update",
        "flight_id": 123,
        "flight_number": "AI101",
        "price": 4200.0,
        "seats": 45,
        "timestamp": "2025-12-09T08:30:00Z"
    }
    """
    await manager.connect(websocket)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection_established",
            "message": "Connected to FlySmart real-time updates",
            "timestamp": asyncio.get_event_loop().time()
        })
        
        # Keep connection alive and listen for client messages
        while True:
            # Wait for any message from client (ping/pong or commands)
            try:
                data = await websocket.receive_text()
                # Echo back for ping/pong
                if data == "ping":
                    await websocket.send_text("pong")
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error receiving WebSocket message: {e}")
                break
    
    except WebSocketDisconnect:
        logger.info("Client disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)
