import json
from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["signaling"])

# Track connections per camera: {camera_id: {"publisher": ws, "viewers": [ws, ...]}}
rooms = defaultdict(lambda: {"publisher": None, "viewers": []})


@router.websocket("/api/ws/signaling/{camera_id}")
async def signaling(websocket: WebSocket, camera_id: str):
    await websocket.accept()
    role = None

    try:
        # First message should identify role
        init_msg = await websocket.receive_text()
        data = json.loads(init_msg)
        role = data.get("role", "viewer")

        room = rooms[camera_id]

        if role == "publisher":
            room["publisher"] = websocket
            # Notify existing viewers that publisher is available
            for viewer in room["viewers"]:
                try:
                    await viewer.send_text(json.dumps({"type": "publisher-joined"}))
                except Exception:
                    pass
        else:
            room["viewers"].append(websocket)
            # If publisher exists, notify viewer
            if room["publisher"]:
                await websocket.send_text(json.dumps({"type": "publisher-available"}))

        # Relay messages between publisher and viewers
        while True:
            msg_text = await websocket.receive_text()
            msg = json.loads(msg_text)
            msg_type = msg.get("type")

            if role == "publisher":
                # Forward to specific viewer or broadcast to all viewers
                target_idx = msg.get("target")
                if target_idx is not None and 0 <= target_idx < len(room["viewers"]):
                    try:
                        await room["viewers"][target_idx].send_text(json.dumps(msg))
                    except Exception:
                        pass
                else:
                    for viewer in room["viewers"]:
                        try:
                            await viewer.send_text(json.dumps(msg))
                        except Exception:
                            pass
            else:
                # Viewer sends to publisher
                if room["publisher"]:
                    # Include viewer index so publisher can target responses
                    viewer_idx = room["viewers"].index(websocket) if websocket in room["viewers"] else -1
                    msg["viewer_idx"] = viewer_idx
                    try:
                        await room["publisher"].send_text(json.dumps(msg))
                    except Exception:
                        pass

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        room = rooms[camera_id]
        if role == "publisher" and room["publisher"] == websocket:
            room["publisher"] = None
            for viewer in room["viewers"]:
                try:
                    await viewer.send_text(json.dumps({"type": "publisher-left"}))
                except Exception:
                    pass
        elif role == "viewer" and websocket in room["viewers"]:
            room["viewers"].remove(websocket)

        # Clean up empty rooms
        if room["publisher"] is None and not room["viewers"]:
            rooms.pop(camera_id, None)
