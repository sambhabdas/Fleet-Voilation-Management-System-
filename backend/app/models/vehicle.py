from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(50), unique=True, nullable=False, index=True)
    model = Column(String(255))
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    status = Column(String(50), default="active")  # active, maintenance, retired

    company = relationship("Company", back_populates="vehicles")
    driver = relationship("Driver", back_populates="vehicle", uselist=False)
    violations = relationship("Violation", back_populates="vehicle")
    cameras = relationship("Camera", back_populates="vehicle", foreign_keys="[Camera.vehicle_id]")
