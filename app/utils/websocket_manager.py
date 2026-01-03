# app/utils/websocket_manager.py
"""
WebSocket Connection Manager for Real-Time Flight Updates
Handles multiple client connections and broadcasts flight updates.
"""
from typing import List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and broadcasts messages to all connected clients."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket connection. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection from active connections."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """
        Broadcast a message to all connected clients.
        Automatically removes dead connections.
        
        Args:
            message: Dictionary to be sent as JSON to all clients
        """
        if not self.active_connections:
            return
        
        # Convert message to JSON string
        try:
            message_json = json.dumps(message)
        except Exception as e:
            logger.error(f"Failed to serialize message: {e}")
            return
        
        # Track dead connections to remove
        dead_connections = []
        
        # Broadcast to all active connections
        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.warning(f"Failed to send message to client: {e}")
                dead_connections.append(connection)
        
        # Clean up dead connections
        for dead in dead_connections:
            self.disconnect(dead)


# Global singleton instance
manager = ConnectionManager()
