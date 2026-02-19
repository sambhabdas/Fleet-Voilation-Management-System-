from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.violation import Violation
from app.models.safety_score import SafetyScore
from app.models.driver import Driver


PENALTY_MAP = {
    "phone_usage": 15,
    "drowsiness": 20,
    "harsh_braking": 5,
    "overspeed": 7,
    "no_seatbelt": 10,
    "yawning": 5,
    "sudden_acceleration": 5,
    "distracted": 15,
}


def get_penalty_points(event_type: str) -> int:
    return PENALTY_MAP.get(event_type, 5)


def get_risk_level(score: int) -> str:
    if score >= 90:
        return "Low"
    if score >= 75:
        return "Moderate"
    if score >= 60:
        return "High"
    return "Critical"


def calculate_monthly_score(db: Session, driver_id: int, month_str: str) -> SafetyScore:
    total_penalty = (
        db.query(func.coalesce(func.sum(Violation.penalty_points), 0))
        .filter(
            Violation.driver_id == driver_id,
            func.strftime("%Y-%m", Violation.timestamp) == month_str,
            Violation.review_status != "dismissed",
        )
        .scalar()
    )
    final_score = max(0, 100 - total_penalty)
    risk_level = get_risk_level(final_score)

    existing = (
        db.query(SafetyScore)
        .filter(SafetyScore.driver_id == driver_id, SafetyScore.month == month_str)
        .first()
    )
    if existing:
        existing.total_penalty = total_penalty
        existing.final_score = final_score
        existing.risk_level = risk_level
        db.commit()
        db.refresh(existing)
        return existing
    else:
        score = SafetyScore(
            driver_id=driver_id,
            month=month_str,
            total_penalty=total_penalty,
            final_score=final_score,
            risk_level=risk_level,
        )
        db.add(score)
        db.commit()
        db.refresh(score)
        return score


def recalculate_all_scores(db: Session, month_str: str):
    drivers = db.query(Driver).filter(Driver.active == True).all()
    for driver in drivers:
        calculate_monthly_score(db, driver.id, month_str)
