from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SafetyScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    driver_id: int
    driver_name: str | None = None
    month: str
    total_penalty: int
    final_score: int
    risk_level: str
    created_at: datetime | None = None


class FleetAverageResponse(BaseModel):
    month: str
    average_score: float
    total_drivers: int
