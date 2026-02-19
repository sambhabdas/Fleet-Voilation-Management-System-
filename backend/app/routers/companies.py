from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_admin
from app.models.company import Company
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("", response_model=list[CompanyResponse])
def list_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    companies = db.query(Company).all()
    result = []
    for c in companies:
        vehicle_count = db.query(func.count(Vehicle.id)).filter(Vehicle.company_id == c.id).scalar()
        driver_count = (
            db.query(func.count(Driver.id))
            .join(Vehicle, Driver.vehicle_id == Vehicle.id)
            .filter(Vehicle.company_id == c.id)
            .scalar()
        )
        resp = CompanyResponse(
            id=c.id,
            name=c.name,
            country=c.country,
            created_at=c.created_at,
            vehicle_count=vehicle_count,
            driver_count=driver_count,
        )
        result.append(resp)
    return result


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    vehicle_count = db.query(func.count(Vehicle.id)).filter(Vehicle.company_id == company.id).scalar()
    driver_count = (
        db.query(func.count(Driver.id))
        .join(Vehicle, Driver.vehicle_id == Vehicle.id)
        .filter(Vehicle.company_id == company.id)
        .scalar()
    )
    return CompanyResponse(
        id=company.id,
        name=company.name,
        country=company.country,
        created_at=company.created_at,
        vehicle_count=vehicle_count,
        driver_count=driver_count,
    )


@router.post("", response_model=CompanyResponse)
def create_company(
    data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    company = Company(name=data.name, country=data.country)
    db.add(company)
    db.commit()
    db.refresh(company)
    return CompanyResponse(
        id=company.id,
        name=company.name,
        country=company.country,
        created_at=company.created_at,
    )


@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if data.name is not None:
        company.name = data.name
    if data.country is not None:
        company.country = data.country
    db.commit()
    db.refresh(company)
    return CompanyResponse(
        id=company.id,
        name=company.name,
        country=company.country,
        created_at=company.created_at,
    )
