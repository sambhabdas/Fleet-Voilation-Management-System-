from pydantic import BaseModel


class VehicleBase(BaseModel):
    plate_number: str
    model: str | None = None
    company_id: int
    status: str = "active"


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    plate_number: str | None = None
    model: str | None = None
    company_id: int | None = None
    status: str | None = None


class VehicleResponse(VehicleBase):
    id: int
    company_name: str | None = None
    driver_name: str | None = None

    class Config:
        from_attributes = True
