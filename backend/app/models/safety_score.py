from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class SafetyScore(Base):
    __tablename__ = "safety_scores"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    month = Column(String(7), nullable=False)  # "2025-01" format
    total_penalty = Column(Integer, default=0)
    final_score = Column(Integer, default=100)
    risk_level = Column(String(50), default="Low")
    created_at = Column(DateTime, default=func.now())

    driver = relationship("Driver", back_populates="safety_scores")
