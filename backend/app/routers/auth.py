from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.core.security import verify_password, hash_password, create_access_token
from app.core.permissions import require_admin
from app.models.user import User
from app.models.driver import Driver
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(
        data={"user_id": user.id, "role": user.role, "company_id": user.company_id}
    )
    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=UserResponse)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    if request.role not in ("ADMIN", "MANAGER", "VIEWER", "DRIVER"):
        raise HTTPException(status_code=400, detail="Invalid role")
    user = User(
        username=request.username,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        role=request.role,
        company_id=request.company_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.get("/me/driver")
def get_my_driver_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="No driver profile linked to this user")
    return {"id": driver.id, "name": driver.name, "employee_id": driver.employee_id}
