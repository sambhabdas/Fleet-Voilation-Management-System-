from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.violation import Violation
from app.models.camera import Camera
from app.schemas.violation import WebhookPayload
from app.services.scoring_engine import get_penalty_points, calculate_monthly_score

router = APIRouter(prefix="/api/webhook", tags=["webhook"])


@router.post("/violation", status_code=201)
def receive_violation(
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

    return {"id": v.id, "message": "Violation recorded successfully"}
