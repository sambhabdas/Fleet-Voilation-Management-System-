from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    event_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(50), nullable=False)
    penalty_points = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    speed = Column(Integer, nullable=True)
    video_url = Column(String(500), nullable=True)
    snapshot_url = Column(String(500), nullable=True)
    clip_url = Column(String(500), nullable=True)
    review_status = Column(String(20), default="pending", index=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    driver = relationship("Driver", back_populates="violations")
    vehicle = relationship("Vehicle", back_populates="violations")
