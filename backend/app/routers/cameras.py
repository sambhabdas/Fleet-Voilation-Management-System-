import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_admin
from app.models.camera import Camera
from app.models.user import User
from app.schemas.camera import CameraCreate, CameraUpdate, CameraResponse
from app.routers.notifications import broadcast_event

router = APIRouter(prefix="/api/cameras", tags=["cameras"])


def _enrich(camera: Camera) -> CameraResponse:
    return CameraResponse(
        id=camera.id,
        name=camera.name,
        camera_type=camera.camera_type,
        location=camera.location,
        vehicle_id=camera.vehicle_id,
        api_key=camera.api_key,
        status=camera.status,
        last_heartbeat=camera.last_heartbeat,
        stream_url=camera.stream_url,
        created_at=camera.created_at,
        updated_at=camera.updated_at,
        vehicle_plate=camera.vehicle.plate_number if camera.vehicle else None,
        current_driver_id=camera.current_driver_id,
        current_vehicle_id=camera.current_vehicle_id,
        current_driver_name=camera.current_driver.name if camera.current_driver else None,
        current_vehicle_plate=camera.current_vehicle.plate_number if camera.current_vehicle else None,
    )


@router.get("", response_model=list[CameraResponse])
def list_cameras(
    status: str | None = Query(None),
    vehicle_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Camera)
    if status:
        q = q.filter(Camera.status == status)
    if vehicle_id:
        q = q.filter(Camera.vehicle_id == vehicle_id)
    return [_enrich(c) for c in q.all()]


@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return _enrich(camera)


@router.post("", response_model=CameraResponse, status_code=201)
def create_camera(
    data: CameraCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    camera = Camera(
        name=data.name,
        camera_type=data.camera_type,
        location=data.location,
        vehicle_id=data.vehicle_id,
        stream_url=data.stream_url,
        api_key=secrets.token_hex(32),
        status="offline",
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return _enrich(camera)


@router.put("/{camera_id}", response_model=CameraResponse)
def update_camera(
    camera_id: int,
    data: CameraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    for field in ["name", "camera_type", "location", "vehicle_id", "stream_url", "status"]:
        val = getattr(data, field, None)
        if val is not None:
            setattr(camera, field, val)
    db.commit()
    db.refresh(camera)
    return _enrich(camera)


@router.delete("/{camera_id}", status_code=204)
def delete_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    db.delete(camera)
    db.commit()


@router.post("/{camera_id}/regenerate-key", response_model=CameraResponse)
def regenerate_api_key(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    camera.api_key = secrets.token_hex(32)
    db.commit()
    db.refresh(camera)
    return _enrich(camera)


@router.post("/heartbeat")
async def camera_heartbeat(
    x_api_key: str = Header(...),
    driver_id: int | None = Query(None),
    vehicle_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    camera = db.query(Camera).filter(Camera.api_key == x_api_key).first()
    if not camera:
        raise HTTPException(status_code=401, detail="Invalid camera API key")
    camera.status = "online"
    camera.last_heartbeat = datetime.now()
    camera.current_driver_id = driver_id
    camera.current_vehicle_id = vehicle_id
    db.commit()

    # Broadcast camera heartbeat to WebSocket clients
    await broadcast_event("camera:heartbeat", {
        "camera_id": camera.id,
        "name": camera.name,
        "status": "online",
        "last_heartbeat": camera.last_heartbeat.isoformat(),
        "current_driver_id": driver_id,
        "current_vehicle_id": vehicle_id,
    })

    return {"status": "ok", "camera_id": camera.id}
