from pydantic_settings import BaseSettings



class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./fleet_violations.db"
    SECRET_KEY: str = "fleet-monitoring-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    CORS_ORIGINS: str = "http://localhost:5173"
    WEBHOOK_API_KEY: str = "dashcam-webhook-secret-key"
    FCM_SERVICE_ACCOUNT_PATH: str = ""
    # Directory for uploads (set to /tmp/uploads for Vercel/static hosting)
    UPLOADS_DIR: str = "/tmp/uploads"


    class Config:
        env_file = ".env"


settings = Settings()
