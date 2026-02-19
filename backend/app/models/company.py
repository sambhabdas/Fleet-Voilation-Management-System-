from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    country = Column(String(100))
    created_at = Column(DateTime, default=func.now())

    vehicles = relationship("Vehicle", back_populates="company")
    users = relationship("User", back_populates="company")
