from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_admin
from app.models.safety_score import SafetyScore
from app.models.driver import Driver
from app.models.user import User
from app.schemas.safety_score import SafetyScoreResponse, FleetAverageResponse
from app.services.scoring_engine import recalculate_all_scores

router = APIRouter(prefix="/api/safety-scores", tags=["safety-scores"])


@router.get("", response_model=list[SafetyScoreResponse])
def list_scores(
    driver_id: int | None = Query(None),
    month: str | None = Query(None),
    risk_level: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(SafetyScore)
    if driver_id:
        q = q.filter(SafetyScore.driver_id == driver_id)
    if month:
        q = q.filter(SafetyScore.month == month)
    if risk_level:
        q = q.filter(SafetyScore.risk_level == risk_level)
    scores = q.order_by(desc(SafetyScore.month)).all()
    result = []
    for s in scores:
        driver = db.query(Driver).filter(Driver.id == s.driver_id).first()
        result.append(SafetyScoreResponse(
            id=s.id,
            driver_id=s.driver_id,
            driver_name=driver.name if driver else None,
            month=s.month,
            total_penalty=s.total_penalty,
            final_score=s.final_score,
            risk_level=s.risk_level,
            created_at=s.created_at,
        ))
    return result


@router.get("/fleet-average", response_model=FleetAverageResponse)
def fleet_average(
    month: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not month:
        month = datetime.now().strftime("%Y-%m")
    avg_score = (
        db.query(func.avg(SafetyScore.final_score))
        .filter(SafetyScore.month == month)
        .scalar()
    )
    total_drivers = (
        db.query(func.count(SafetyScore.id))
        .filter(SafetyScore.month == month)
        .scalar()
    )
    return FleetAverageResponse(
        month=month,
        average_score=round(avg_score or 0, 1),
        total_drivers=total_drivers,
    )


@router.get("/{driver_id}/latest", response_model=SafetyScoreResponse)
def get_latest_score(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    score = (
        db.query(SafetyScore)
        .filter(SafetyScore.driver_id == driver_id)
        .order_by(desc(SafetyScore.month))
        .first()
    )
    if not score:
        raise HTTPException(status_code=404, detail="No score found for driver")
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    return SafetyScoreResponse(
        id=score.id,
        driver_id=score.driver_id,
        driver_name=driver.name if driver else None,
        month=score.month,
        total_penalty=score.total_penalty,
        final_score=score.final_score,
        risk_level=score.risk_level,
        created_at=score.created_at,
    )


@router.post("/recalculate")
def recalculate(
    month: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    recalculate_all_scores(db, month)
    return {"message": f"Scores recalculated for {month}"}
