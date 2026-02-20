from pydantic import BaseModel, ConfigDict


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
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str | None = None
    driver_name: str | None = None
