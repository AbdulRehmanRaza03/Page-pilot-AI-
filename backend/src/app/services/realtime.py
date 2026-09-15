"""In-memory WebSocket connection manager for real-time inbox updates.

Single-process broadcast: every connected client in this worker receives events
when a message/event is pushed. Multi-instance deployments should be backed by
Redis pub/sub, but for the MVP single-instance case this is sufficient.
"""

from __future__ import annotations

import json
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, event: dict[str, Any]) -> None:
        if not self.active:
            return
        payload = json.dumps(event, default=str)
        dead: list[WebSocket] = []
        for ws in list(self.active):
            try:
                await ws.send_text(payload)
            except Exception:  # noqa: BLE001
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


async def broadcast_event(event_type: str, data: dict[str, Any]) -> None:
    """Asynchronously broadcast an event to all connected clients."""
    await manager.broadcast({"type": event_type, "data": data})
