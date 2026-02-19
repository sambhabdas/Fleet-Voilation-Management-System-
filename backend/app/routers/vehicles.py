from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_admin
from app.models.vehicle import Vehicle
from app.models.company import Company
from app.models.driver import Driver
from app.models.user import User
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(
    company_id: int | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Vehicle)
    if company_id:
        q = q.filter(Vehicle.company_id == company_id)
    if status:
        q = q.filter(Vehicle.status == status)
    vehicles = q.all()
    result = []
    for v in vehicles:
        company_name = v.company.name if v.company else None
        driver_name = v.driver.name if v.driver else None
        result.append(VehicleResponse(
            id=v.id,
            plate_number=v.plate_number,
            model=v.model,
            company_id=v.company_id,
            status=v.status,
            company_name=company_name,
            driver_name=driver_name,
        ))
    return result


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return VehicleResponse(
        id=v.id,
        plate_number=v.plate_number,
        model=v.model,
        company_id=v.company_id,
        status=v.status,
        company_name=v.company.name if v.company else None,
        driver_name=v.driver.name if v.driver else None,
    )


@router.post("", response_model=VehicleResponse)
def create_vehicle(
    data: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(Vehicle).filter(Vehicle.plate_number == data.plate_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plate number already exists")
    v = Vehicle(
        plate_number=data.plate_number,
        model=data.model,
        company_id=data.company_id,
        status=data.status,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return VehicleResponse(
        id=v.id,
        plate_number=v.plate_number,
        model=v.model,
        company_id=v.company_id,
        status=v.status,
    )


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if data.plate_number is not None:
        v.plate_number = data.plate_number
    if data.model is not None:
        v.model = data.model
    if data.company_id is not None:
        v.company_id = data.company_id
    if data.status is not None:
        v.status = data.status
    db.commit()
    db.refresh(v)
    return VehicleResponse(
        id=v.id,
        plate_number=v.plate_number,
        model=v.model,
        company_id=v.company_id,
        status=v.status,
        company_name=v.company.name if v.company else None,
        driver_name=v.driver.name if v.driver else None,
    )
