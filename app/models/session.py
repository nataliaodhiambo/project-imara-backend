import uuid
from sqlalchemy import Column, String, Date, Integer, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class TrainingSession(Base):
    __tablename__ = "training_sessions"

    session_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_date = Column(Date, nullable=False)
    drill_type = Column(String(50), nullable=False)
    planned_duration_mins = Column(Integer, nullable=False)
    actual_duration_mins = Column(Integer, nullable=True)
    intensity_target = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    telemetry_logs = relationship("RawTelemetry", back_populates="session")
    feature_windows = relationship("FeatureWindow5Min", back_populates="session")