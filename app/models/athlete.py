import uuid
from sqlalchemy import Column, String, Date, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Athlete(Base):
    __tablename__ = "athletes"

    athlete_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    position = Column(String(20), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    baselines = relationship("AthleteBaseline", back_populates="athlete", cascade="all, delete-orphan")
    telemetry_logs = relationship("RawTelemetry", back_populates="athlete")
    feature_windows = relationship("FeatureWindow5Min", back_populates="athlete")
    alerts = relationship("RiskAlert", back_populates="athlete")


class AthleteBaseline(Base):
    __tablename__ = "athlete_baselines"

    baseline_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id = Column(String, ForeignKey("athletes.athlete_id"), nullable=False)
    calculation_date = Column(Date, nullable=False)
    avg_28day_hrv = Column(Numeric(5, 2), nullable=False)
    avg_28day_hsr = Column(Numeric(6, 2), nullable=False)
    hsr_threshold_upper = Column(Numeric(6, 2), nullable=False)
    hrv_threshold_lower = Column(Numeric(5, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    athlete = relationship("Athlete", back_populates="baselines")