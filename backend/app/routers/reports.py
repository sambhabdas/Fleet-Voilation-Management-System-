from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import require_manager_or_above
from app.models.user import User
from app.schemas.report import ReportRequest, ReportSummary
from app.services.report_service import generate_report

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/generate", response_model=ReportSummary)
def create_report(
    request: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    return generate_report(db, request)


@router.get("/weekly", response_model=ReportSummary)
def weekly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    return generate_report(db, ReportRequest(period="weekly"))


@router.get("/monthly", response_model=ReportSummary)
def monthly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    return generate_report(db, ReportRequest(period="monthly"))
