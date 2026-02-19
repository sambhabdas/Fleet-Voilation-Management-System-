from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import math

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_admin
from app.core.security import hash_password
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.violation import Violation
from app.models.safety_score import SafetyScore
from app.models.user import User
from app.schemas.driver import DriverCreate, DriverUpdate, DriverResponse
from app.schemas.violation import ViolationResponse, ViolationListResponse
from app.schemas.safety_score import SafetyScoreResponse
from app.routers.violations import _violation_to_response

router = APIRouter(prefix="/api/drivers", tags=["drivers"])


def _enrich_driver(db: Session, driver: Driver) -> DriverResponse:
    vehicle_plate = driver.vehicle.plate_number if driver.vehicle else None
    latest_score = (
        db.query(SafetyScore)
        .filter(SafetyScore.driver_id == driver.id)
        .order_by(desc(SafetyScore.month))
        .first()
    )
    violation_count = db.query(func.count(Violation.id)).filter(Violation.driver_id == driver.id).scalar()
    return DriverResponse(
        id=driver.id,
        name=driver.name,
        employee_id=driver.employee_id,
        vehicle_id=driver.vehicle_id,
        country=driver.country,
        active=driver.active,
        user_id=driver.user_id,
        username=driver.user.username if driver.user else None,
        vehicle_plate=vehicle_plate,
        latest_score=latest_score.final_score if latest_score else None,
        risk_level=latest_score.risk_level if latest_score else None,
        violation_count=violation_count,
    )


@router.get("", response_model=list[DriverResponse])
def list_drivers(
    company_id: int | None = Query(None),
    risk_level: str | None = Query(None),
    active: bool | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Driver)
    if active is not None:
        q = q.filter(Driver.active == active)
    if company_id:
        q = q.join(Vehicle, Driver.vehicle_id == Vehicle.id).filter(Vehicle.company_id == company_id)
    drivers = q.all()
    result = [_enrich_driver(db, d) for d in drivers]
    if risk_level:
        result = [r for r in result if r.risk_level == risk_level]
    return result


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return _enrich_driver(db, driver)


@router.post("", response_model=DriverResponse)
def create_driver(
    data: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(Driver).filter(Driver.employee_id == data.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    # Optionally create a user account for the driver
    user = None
    if data.username and data.password:
        existing_user = db.query(User).filter(User.username == data.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
        user = User(
            username=data.username,
            password_hash=hash_password(data.password),
            full_name=data.name,
            role="DRIVER",
        )
        db.add(user)
        db.flush()

    driver = Driver(
        name=data.name,
        employee_id=data.employee_id,
        vehicle_id=data.vehicle_id,
        country=data.country,
        active=data.active,
        user_id=user.id if user else None,
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return _enrich_driver(db, driver)


@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: int,
    data: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    if data.name is not None:
        driver.name = data.name
    if data.vehicle_id is not None:
        driver.vehicle_id = data.vehicle_id
    if data.country is not None:
        driver.country = data.country
    if data.active is not None:
        driver.active = data.active
    db.commit()
    db.refresh(driver)
    return _enrich_driver(db, driver)


@router.get("/{driver_id}/violations", response_model=ViolationListResponse)
def get_driver_violations(
    driver_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    total = db.query(func.count(Violation.id)).filter(Violation.driver_id == driver_id).scalar()
    violations = (
        db.query(Violation)
        .filter(Violation.driver_id == driver_id)
        .order_by(desc(Violation.timestamp))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = [_violation_to_response(v) for v in violations]
    return ViolationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/{driver_id}/scores", response_model=list[SafetyScoreResponse])
def get_driver_scores(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    scores = (
        db.query(SafetyScore)
        .filter(SafetyScore.driver_id == driver_id)
        .order_by(SafetyScore.month)
        .all()
    )
    return [
        SafetyScoreResponse(
            id=s.id,
            driver_id=s.driver_id,
            driver_name=driver.name,
            month=s.month,
            total_penalty=s.total_penalty,
            final_score=s.final_score,
            risk_level=s.risk_level,
            created_at=s.created_at,
        )
        for s in scores
    ]
