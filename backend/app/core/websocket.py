from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
from loguru import logger


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected: user={user_id}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected: user={user_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message: {e}")

    async def broadcast(self, message: dict, exclude: Set[str] = None):
        exclude = exclude or set()
        for user_id, connections in self.active_connections.items():
            if user_id not in exclude:
                for connection in connections:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        logger.error(f"Broadcast failed: {e}")


manager = ConnectionManager()


def setup_websocket(app: FastAPI):
    @app.websocket("/ws/progress/{user_id}")
    async def websocket_progress(websocket: WebSocket, user_id: str):
        await manager.connect(websocket, user_id)
        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                await manager.send_personal_message(
                    {"type": "ack", "original": message}, user_id
                )
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)

    @app.websocket("/ws/notifications/{user_id}")
    async def websocket_notifications(websocket: WebSocket, user_id: str):
        await manager.connect(websocket, user_id)
        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                await manager.send_personal_message(
                    {"type": "notification_ack", "original": message}, user_id
                )
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)
