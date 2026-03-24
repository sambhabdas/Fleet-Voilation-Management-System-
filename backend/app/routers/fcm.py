from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/fcm", tags=["fcm"])


class FCMTokenRequest(BaseModel):
    token: str


@router.post("/register")
def register_fcm_token(
    body: FCMTokenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.fcm_token = body.token
    db.commit()
    return {"status": "ok"}


@router.delete("/register")
def unregister_fcm_token(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.fcm_token = None
    db.commit()
    return {"status": "ok"}
