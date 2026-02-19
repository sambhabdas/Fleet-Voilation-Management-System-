import secrets

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    camera_type = Column(String(50), nullable=False)  # dashcam, cabin, external, webcam
    location = Column(String(255), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    api_key = Column(String(64), unique=True, nullable=False, index=True, default=lambda: secrets.token_hex(32))
    status = Column(String(20), default="offline")  # online, offline, error
    last_heartbeat = Column(DateTime, nullable=True)
    stream_url = Column(String(500), nullable=True)
    current_driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    current_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    vehicle = relationship("Vehicle", back_populates="cameras", foreign_keys=[vehicle_id])
    current_driver = relationship("Driver", foreign_keys=[current_driver_id])
    current_vehicle = relationship("Vehicle", foreign_keys=[current_vehicle_id])
