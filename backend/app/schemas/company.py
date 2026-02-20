from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CompanyBase(BaseModel):
    name: str
    country: str | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = None
    country: str | None = None


class CompanyResponse(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime | None = None
    vehicle_count: int = 0
    driver_count: int = 0
