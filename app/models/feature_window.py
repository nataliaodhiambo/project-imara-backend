import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base

class FeatureWindow5Min(Base):
    __tablename__ = "feature_windows_5min"
    __table_args__ = (
        UniqueConstraint("athlete_id", "session_id", "window_start", name="uq_window_athlete_session_start"),
    )

    window_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id = Column(String, ForeignKey("athletes.athlete_id"), nullable=False, index=True)
    session_id = Column(String, ForeignKey("training_sessions.session_id"), nullable=False, index=True)
    window_start = Column(DateTime(timezone=True), nullable=False)
    window_end = Column(DateTime(timezone=True), nullable=False)
    sample_count = Column(Integer, nullable=False)

    # Aggregated features
    avg_heart_rate = Column(Float, nullable=False)
    max_heart_rate = Column(Integer, nullable=False)
    avg_hrv_ms = Column(Float, nullable=False)
    avg_speed_m_s = Column(Float, nullable=False)
    max_speed_m_s = Column(Float, nullable=False)
    total_distance_m = Column(Float, nullable=False)
    hsr_distance_m = Column(Float, nullable=False)

    # Deviation from the athlete's 28-day baseline (null when no baseline exists)
    hrv_deviation_pct = Column(Float, nullable=True)
    hsr_deviation_pct = Column(Float, nullable=True)

    risk_score = Column(Float, nullable=True)
    risk_level = Column(String(10), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    athlete = relationship("Athlete", back_populates="feature_windows")
    session = relationship("TrainingSession", back_populates="feature_windows")
    alerts = relationship("RiskAlert", back_populates="window", cascade="all, delete-orphan")
