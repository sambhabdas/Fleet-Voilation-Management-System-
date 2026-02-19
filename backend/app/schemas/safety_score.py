from datetime import datetime

from pydantic import BaseModel


class SafetyScoreResponse(BaseModel):
    id: int
    driver_id: int
    driver_name: str | None = None
    month: str
    total_penalty: int
    final_score: int
    risk_level: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class FleetAverageResponse(BaseModel):
    month: str
    average_score: float
    total_drivers: int
