import json
import asyncio
from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.core.security import decode_access_token

router = APIRouter(tags=["notifications"])

# Connected clients: {user_id: [websocket, ...]}
_connections: dict[int, list[WebSocket]] = defaultdict(list)
_lock = asyncio.Lock()


async def broadcast_event(event_type: str, payload: dict):
    """Broadcast an event to all connected WebSocket clients."""
    message = json.dumps({"type": event_type, "data": payload})
    async with _lock:
        all_sockets = [ws for sockets in _connections.values() for ws in sockets]
    for ws in all_sockets:
        try:
            await ws.send_text(message)
        except Exception:
            pass


@router.websocket("/api/ws/notifications")
async def notifications_ws(websocket: WebSocket, token: str = Query(...)):
    # Authenticate via JWT
    payload = decode_access_token(token)
    if payload is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = payload.get("user_id")
    if user_id is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await websocket.accept()

    async with _lock:
        _connections[user_id].append(websocket)

    try:
        # Send confirmation
        await websocket.send_text(json.dumps({"type": "connected", "data": {"user_id": user_id}}))
        # Keep connection alive, wait for client messages (ping/pong handled by protocol)
        while True:
            # We don't expect client messages, but we need to keep reading to detect disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        async with _lock:
            if websocket in _connections[user_id]:
                _connections[user_id].remove(websocket)
            if not _connections[user_id]:
                _connections.pop(user_id, None)
