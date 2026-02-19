from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str | None
    role: str
    company_id: int | None

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str | None = None
    role: str = "VIEWER"
    company_id: int | None = None
