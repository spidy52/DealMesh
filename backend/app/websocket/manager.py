import json
import asyncio
from typing import List, Dict, Any, Set
from fastapi import WebSocket

class WebSocketConnectionManager:
    """
    Real-time WebSocket Hub distributing events to Desktop Pet, Buyer Portal,
    and Merchant Dashboard.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.channel_subscriptions: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        for channel, subs in list(self.channel_subscriptions.items()):
            if websocket in subs:
                subs.remove(websocket)

    async def subscribe_channel(self, websocket: WebSocket, channel: str):
        if channel not in self.channel_subscriptions:
            self.channel_subscriptions[channel] = set()
        self.channel_subscriptions[channel].add(websocket)

    async def broadcast_event(self, event_type: str, data: Dict[str, Any], channel: str = "global"):
        payload = {
            "type": event_type,
            "channel": channel,
            "data": data,
            "timestamp": data.get("timestamp") or str(asyncio.get_event_loop().time())
        }
        text_data = json.dumps(payload)

        # Broadcast to general connections and subscribers
        recipients = list(self.active_connections)
        if channel in self.channel_subscriptions:
            recipients.extend(list(self.channel_subscriptions[channel]))
        
        # Deduplicate
        unique_recipients = list(set(recipients))
        for connection in unique_recipients:
            try:
                await connection.send_text(text_data)
            except Exception:
                pass

ws_manager = WebSocketConnectionManager()
