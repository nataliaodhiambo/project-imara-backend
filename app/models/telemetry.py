import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class RawTelemetry(Base):
    __tablename__ = "raw_telemetry"

    telemetry_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id = Column(String, ForeignKey("athletes.athlete_id"), nullable=False, index=True)
    session_id = Column(String, ForeignKey("training_sessions.session_id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    heart_rate = Column(Integer, nullable=False)
    hrv_ms = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_m_s = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    athlete = relationship("Athlete", back_populates="telemetry_logs")
    session = relationship("TrainingSession", back_populates="telemetry_logs")
