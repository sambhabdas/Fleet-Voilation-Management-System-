from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    employee_id = Column(String(100), unique=True, nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    country = Column(String(100))
    active = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)

    vehicle = relationship("Vehicle", back_populates="driver")
    violations = relationship("Violation", back_populates="driver")
    safety_scores = relationship("SafetyScore", back_populates="driver")
    user = relationship("User", backref="driver_profile")
