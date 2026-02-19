from pydantic import BaseModel


class DriverBase(BaseModel):
    name: str
    employee_id: str
    vehicle_id: int | None = None
    country: str | None = None
    active: bool = True


class DriverCreate(DriverBase):
    username: str | None = None
    password: str | None = None


class DriverUpdate(BaseModel):
    name: str | None = None
    vehicle_id: int | None = None
    country: str | None = None
    active: bool | None = None


class DriverResponse(DriverBase):
    id: int
    user_id: int | None = None
    username: str | None = None
    vehicle_plate: str | None = None
    latest_score: int | None = None
    risk_level: str | None = None
    violation_count: int = 0

    class Config:
        from_attributes = True
