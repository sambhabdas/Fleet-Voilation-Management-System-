import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.models import User, Company, Vehicle, Driver, Violation, SafetyScore, Camera
from app.routers import auth, companies, vehicles, drivers, violations, webhook, dashboard, reports, safety_scores, cameras, uploads, signaling


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Fleet Violation Monitoring",
    description="AI-powered fleet safety monitoring and violation tracking system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(violations.router)
app.include_router(webhook.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(safety_scores.router)
app.include_router(cameras.router)
app.include_router(uploads.router)
app.include_router(signaling.router)

# Mount static files for uploads
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Fleet Violation Monitoring API"}
