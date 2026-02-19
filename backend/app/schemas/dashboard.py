from datetime import datetime

from pydantic import BaseModel

from app.schemas.violation import ViolationResponse


class FleetOverview(BaseModel):
    total_drivers: int
    active_drivers: int
    total_vehicles: int
    total_violations_this_month: int
    violations_change_pct: float
    average_fleet_score: float
    critical_risk_drivers: int


class ViolationTrend(BaseModel):
    date: str
    count: int


class ViolationByType(BaseModel):
    event_type: str
    count: int
    percentage: float


class RiskDistribution(BaseModel):
    risk_level: str
    count: int


class TopViolator(BaseModel):
    driver_id: int
    driver_name: str
    violation_count: int
    safety_score: int
    risk_level: str


class DashboardData(BaseModel):
    overview: FleetOverview
    violation_trend: list[ViolationTrend]
    violations_by_type: list[ViolationByType]
    risk_distribution: list[RiskDistribution]
    top_violators: list[TopViolator]
    recent_violations: list[ViolationResponse]
