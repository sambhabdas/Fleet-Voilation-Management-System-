import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.violation import Violation
from app.models.camera import Camera
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.violation import WebhookPayload
from app.services.scoring_engine import get_penalty_points, calculate_monthly_score
from app.routers.notifications import broadcast_event
from app.services.fcm_service import send_violation_notification

router = APIRouter(prefix="/api/webhook", tags=["webhook"])


@router.post("/violation", status_code=201)
async def receive_violation(
    payload: WebhookPayload,
    x_api_key: str = Header(...),
    db: Session = Depends(get_db),
):
    # Validate API key: accept global key OR per-camera key
    camera = None
    if x_api_key == settings.WEBHOOK_API_KEY:
        pass  # global key valid
    else:
        camera = db.query(Camera).filter(Camera.api_key == x_api_key).first()
        if not camera:
            raise HTTPException(status_code=401, detail="Invalid API key")

    penalty = get_penalty_points(payload.event_type)
    v = Violation(
        driver_id=payload.driver_id,
        vehicle_id=payload.vehicle_id,
        event_type=payload.event_type,
        severity=payload.severity,
        penalty_points=penalty,
        timestamp=payload.timestamp,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed=payload.speed,
        video_url=payload.video_url,
        snapshot_url=payload.snapshot_url,
        clip_url=payload.clip_url,
    )
    db.add(v)
    db.commit()
    db.refresh(v)

    # Recalculate score for this driver/month
    month_str = v.timestamp.strftime("%Y-%m")
    calculate_monthly_score(db, v.driver_id, month_str)

    # Update camera heartbeat if identified
    if camera:
        camera.status = "online"
        camera.last_heartbeat = datetime.now(timezone.utc)
        db.commit()

    # Resolve driver and vehicle names for notifications
    driver = db.query(Driver).filter(Driver.id == v.driver_id).first()
    vehicle = db.query(Vehicle).filter(Vehicle.id == v.vehicle_id).first()
    driver_name = driver.name if driver else "Unknown"
    vehicle_plate = vehicle.plate_number if vehicle else "Unknown"

    violation_data = {
        "id": v.id,
        "driver_id": v.driver_id,
        "vehicle_id": v.vehicle_id,
        "driver_name": driver_name,
        "vehicle_plate": vehicle_plate,
        "event_type": v.event_type,
        "severity": v.severity,
        "penalty_points": v.penalty_points,
        "timestamp": v.timestamp.isoformat(),
        "speed": v.speed,
        "snapshot_url": v.snapshot_url,
    }

    # Broadcast to WebSocket clients
    await broadcast_event("violation:new", violation_data)

    # Send FCM push notifications to ADMIN/MANAGER users
    fcm_tokens = [
        u.fcm_token for u in db.query(User).filter(
            User.role.in_(["ADMIN", "MANAGER"]),
            User.fcm_token.isnot(None),
        ).all()
    ]
    if fcm_tokens:
        send_violation_notification(fcm_tokens, violation_data)

    return {"id": v.id, "message": "Violation recorded successfully"}
