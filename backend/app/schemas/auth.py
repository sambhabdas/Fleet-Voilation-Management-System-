from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str | None
    role: str
    company_id: int | None


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
