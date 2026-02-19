from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.dashboard import ViolationByType, TopViolator


class ReportRequest(BaseModel):
    period: str = "monthly"  # weekly or monthly
    date_from: date | None = None
    date_to: date | None = None


class SeverityBreakdown(BaseModel):
    severity: str
    count: int


class ReportSummary(BaseModel):
    period: str
    date_from: date
    date_to: date
    total_violations: int
    violations_by_type: list[ViolationByType]
    violations_by_severity: list[SeverityBreakdown]
    average_score: float
    worst_drivers: list[TopViolator]
    best_drivers: list[TopViolator]
    generated_at: datetime
