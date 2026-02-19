from datetime import datetime

from pydantic import BaseModel


class CompanyBase(BaseModel):
    name: str
    country: str | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = None
    country: str | None = None


class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime | None = None
    vehicle_count: int = 0
    driver_count: int = 0

    class Config:
        from_attributes = True
