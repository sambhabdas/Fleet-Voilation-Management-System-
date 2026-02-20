from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CameraBase(BaseModel):
    name: str
    camera_type: str
    location: str | None = None
    vehicle_id: int | None = None
    stream_url: str | None = None


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    name: str | None = None
    camera_type: str | None = None
    location: str | None = None
    vehicle_id: int | None = None
    stream_url: str | None = None
    status: str | None = None


class CameraResponse(CameraBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    api_key: str
    status: str
    last_heartbeat: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    vehicle_plate: str | None = None
    current_driver_id: int | None = None
    current_vehicle_id: int | None = None
    current_driver_name: str | None = None
    current_vehicle_plate: str | None = None
