import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    alert_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id = Column(String, ForeignKey("athletes.athlete_id"), nullable=False, index=True)
    session_id = Column(String, ForeignKey("training_sessions.session_id"), nullable=False, index=True)
    window_id = Column(String, ForeignKey("feature_windows_5min.window_id"), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(10), nullable=False)
    reason = Column(String(255), nullable=False)
    acknowledged = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    athlete = relationship("Athlete", back_populates="alerts")
    window = relationship("FeatureWindow5Min", back_populates="alerts")
