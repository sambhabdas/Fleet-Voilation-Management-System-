from datetime import datetime, timedelta, date

from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.violation import Violation
from app.models.driver import Driver
from app.models.safety_score import SafetyScore
from app.schemas.report import ReportRequest, ReportSummary, SeverityBreakdown
from app.schemas.dashboard import ViolationByType, TopViolator


def generate_report(db: Session, request: ReportRequest) -> ReportSummary:
    today = date.today()
    if request.date_from and request.date_to:
        date_from = request.date_from
        date_to = request.date_to
    elif request.period == "weekly":
        date_from = today - timedelta(days=7)
        date_to = today
    else:
        date_from = today - timedelta(days=30)
        date_to = today

    dt_from = datetime.combine(date_from, datetime.min.time())
    dt_to = datetime.combine(date_to, datetime.max.time())

    # Total violations
    total_violations = (
        db.query(func.count(Violation.id))
        .filter(Violation.timestamp >= dt_from, Violation.timestamp <= dt_to)
        .scalar()
    )

    # By type
    type_rows = (
        db.query(Violation.event_type, func.count(Violation.id).label("count"))
        .filter(Violation.timestamp >= dt_from, Violation.timestamp <= dt_to)
        .group_by(Violation.event_type)
        .all()
    )
    total_for_pct = sum(r.count for r in type_rows) or 1
    violations_by_type = [
        ViolationByType(
            event_type=r.event_type,
            count=r.count,
            percentage=round(r.count / total_for_pct * 100, 1),
        )
        for r in type_rows
    ]

    # By severity
    severity_rows = (
        db.query(Violation.severity, func.count(Violation.id).label("count"))
        .filter(Violation.timestamp >= dt_from, Violation.timestamp <= dt_to)
        .group_by(Violation.severity)
        .all()
    )
    violations_by_severity = [
        SeverityBreakdown(severity=r.severity, count=r.count)
        for r in severity_rows
    ]

    # Average score for the period's month
    month_str = date_from.strftime("%Y-%m")
    avg_score = (
        db.query(func.avg(SafetyScore.final_score))
        .filter(SafetyScore.month == month_str)
        .scalar()
    )

    # Worst drivers (lowest scores)
    worst_rows = (
        db.query(SafetyScore)
        .filter(SafetyScore.month == month_str)
        .order_by(SafetyScore.final_score)
        .limit(5)
        .all()
    )
    worst_drivers = []
    for s in worst_rows:
        driver = db.query(Driver).filter(Driver.id == s.driver_id).first()
        vc = (
            db.query(func.count(Violation.id))
            .filter(
                Violation.driver_id == s.driver_id,
                Violation.timestamp >= dt_from,
                Violation.timestamp <= dt_to,
            )
            .scalar()
        )
        worst_drivers.append(TopViolator(
            driver_id=s.driver_id,
            driver_name=driver.name if driver else "Unknown",
            violation_count=vc,
            safety_score=s.final_score,
            risk_level=s.risk_level,
        ))

    # Best drivers (highest scores)
    best_rows = (
        db.query(SafetyScore)
        .filter(SafetyScore.month == month_str)
        .order_by(desc(SafetyScore.final_score))
        .limit(5)
        .all()
    )
    best_drivers = []
    for s in best_rows:
        driver = db.query(Driver).filter(Driver.id == s.driver_id).first()
        vc = (
            db.query(func.count(Violation.id))
            .filter(
                Violation.driver_id == s.driver_id,
                Violation.timestamp >= dt_from,
                Violation.timestamp <= dt_to,
            )
            .scalar()
        )
        best_drivers.append(TopViolator(
            driver_id=s.driver_id,
            driver_name=driver.name if driver else "Unknown",
            violation_count=vc,
            safety_score=s.final_score,
            risk_level=s.risk_level,
        ))

    return ReportSummary(
        period=request.period,
        date_from=date_from,
        date_to=date_to,
        total_violations=total_violations,
        violations_by_type=violations_by_type,
        violations_by_severity=violations_by_severity,
        average_score=round(avg_score or 0, 1),
        worst_drivers=worst_drivers,
        best_drivers=best_drivers,
        generated_at=datetime.now(),
    )
