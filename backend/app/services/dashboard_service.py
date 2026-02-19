from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.violation import Violation
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.safety_score import SafetyScore
from app.schemas.dashboard import (
    DashboardData, FleetOverview, ViolationTrend, ViolationByType,
    RiskDistribution, TopViolator,
)
from app.schemas.violation import ViolationResponse


def get_fleet_overview(db: Session) -> FleetOverview:
    total_drivers = db.query(func.count(Driver.id)).scalar()
    active_drivers = db.query(func.count(Driver.id)).filter(Driver.active == True).scalar()
    total_vehicles = db.query(func.count(Vehicle.id)).scalar()

    now = datetime.now()
    current_month = now.strftime("%Y-%m")
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_violations_this_month = (
        db.query(func.count(Violation.id))
        .filter(Violation.timestamp >= first_of_month)
        .scalar()
    )

    # Last month violations for comparison
    last_month_start = (first_of_month - timedelta(days=1)).replace(day=1)
    last_month_violations = (
        db.query(func.count(Violation.id))
        .filter(Violation.timestamp >= last_month_start, Violation.timestamp < first_of_month)
        .scalar()
    )
    if last_month_violations > 0:
        change_pct = ((total_violations_this_month - last_month_violations) / last_month_violations) * 100
    else:
        change_pct = 0.0

    # Fleet average score (current month)
    avg_score = (
        db.query(func.avg(SafetyScore.final_score))
        .filter(SafetyScore.month == current_month)
        .scalar()
    )

    critical_risk = (
        db.query(func.count(SafetyScore.id))
        .filter(SafetyScore.month == current_month, SafetyScore.risk_level == "Critical")
        .scalar()
    )

    return FleetOverview(
        total_drivers=total_drivers,
        active_drivers=active_drivers,
        total_vehicles=total_vehicles,
        total_violations_this_month=total_violations_this_month,
        violations_change_pct=round(change_pct, 1),
        average_fleet_score=round(avg_score or 0, 1),
        critical_risk_drivers=critical_risk,
    )


def get_violation_trend(db: Session, days: int = 30) -> list[ViolationTrend]:
    start_date = datetime.now() - timedelta(days=days)
    rows = (
        db.query(
            func.strftime("%Y-%m-%d", Violation.timestamp).label("date"),
            func.count(Violation.id).label("count"),
        )
        .filter(Violation.timestamp >= start_date)
        .group_by(func.strftime("%Y-%m-%d", Violation.timestamp))
        .order_by(func.strftime("%Y-%m-%d", Violation.timestamp))
        .all()
    )
    return [ViolationTrend(date=r.date, count=r.count) for r in rows]


def get_violations_by_type(db: Session) -> list[ViolationByType]:
    first_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    rows = (
        db.query(
            Violation.event_type,
            func.count(Violation.id).label("count"),
        )
        .filter(Violation.timestamp >= first_of_month)
        .group_by(Violation.event_type)
        .all()
    )
    total = sum(r.count for r in rows)
    return [
        ViolationByType(
            event_type=r.event_type,
            count=r.count,
            percentage=round((r.count / total * 100) if total > 0 else 0, 1),
        )
        for r in rows
    ]


def get_risk_distribution(db: Session) -> list[RiskDistribution]:
    current_month = datetime.now().strftime("%Y-%m")
    rows = (
        db.query(
            SafetyScore.risk_level,
            func.count(SafetyScore.id).label("count"),
        )
        .filter(SafetyScore.month == current_month)
        .group_by(SafetyScore.risk_level)
        .all()
    )
    return [RiskDistribution(risk_level=r.risk_level, count=r.count) for r in rows]


def get_top_violators(db: Session, limit: int = 5) -> list[TopViolator]:
    first_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    current_month = datetime.now().strftime("%Y-%m")

    rows = (
        db.query(
            Violation.driver_id,
            func.count(Violation.id).label("violation_count"),
        )
        .filter(Violation.timestamp >= first_of_month)
        .group_by(Violation.driver_id)
        .order_by(desc(func.count(Violation.id)))
        .limit(limit)
        .all()
    )
    result = []
    for r in rows:
        driver = db.query(Driver).filter(Driver.id == r.driver_id).first()
        score = (
            db.query(SafetyScore)
            .filter(SafetyScore.driver_id == r.driver_id, SafetyScore.month == current_month)
            .first()
        )
        result.append(TopViolator(
            driver_id=r.driver_id,
            driver_name=driver.name if driver else "Unknown",
            violation_count=r.violation_count,
            safety_score=score.final_score if score else 100,
            risk_level=score.risk_level if score else "Low",
        ))
    return result


def get_recent_violations(db: Session, limit: int = 10) -> list[ViolationResponse]:
    violations = (
        db.query(Violation)
        .order_by(desc(Violation.timestamp))
        .limit(limit)
        .all()
    )
    return [
        ViolationResponse(
            id=v.id,
            driver_id=v.driver_id,
            vehicle_id=v.vehicle_id,
            driver_name=v.driver.name if v.driver else None,
            vehicle_plate=v.vehicle.plate_number if v.vehicle else None,
            event_type=v.event_type,
            severity=v.severity,
            penalty_points=v.penalty_points,
            timestamp=v.timestamp,
            latitude=v.latitude,
            longitude=v.longitude,
            speed=v.speed,
            video_url=v.video_url,
            created_at=v.created_at,
        )
        for v in violations
    ]


def get_dashboard_data(db: Session) -> DashboardData:
    return DashboardData(
        overview=get_fleet_overview(db),
        violation_trend=get_violation_trend(db),
        violations_by_type=get_violations_by_type(db),
        risk_distribution=get_risk_distribution(db),
        top_violators=get_top_violators(db),
        recent_violations=get_recent_violations(db),
    )
