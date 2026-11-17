from datetime import datetime
from sqlalchemy import (Boolean, Column, Date, DateTime, Float, ForeignKey,
                        Integer, String, UniqueConstraint)
from app.database import Base


class DailyReadiness(Base):
    """One row per athlete per day. The watch sync job writes here."""
    __tablename__ = "daily_readiness"
    __table_args__ = (UniqueConstraint("athlete_id", "day", name="uq_readiness_athlete_day"),)

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), index=True, nullable=False)
    day = Column(Date, nullable=False)
    hrv_rmssd = Column(Float)
    resting_hr = Column(Float)
    sleep_minutes = Column(Float)
    sleep_efficiency = Column(Float)
    source = Column(String, default="google_health")  # google_health | simulator | demo


class InferenceSnapshot(Base):
    """Latest model output per athlete. The Random Forest writes here once trained."""
    __tablename__ = "inference_snapshots"

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    acwr = Column(Float)
    hr_strain = Column(Float)
    risk_probability = Column(Float)
    risk_band = Column(String)            # low | amber | red
    perf_drop = Column(Boolean, default=False)
    source = Column(String, default="model")  # model | demo


class RecommendationLog(Base):
    """The coach's accept or override decision on each recommendation."""
    __tablename__ = "recommendation_log"

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    rule = Column(String)
    action = Column(String)
    decision = Column(String)             # accepted | overridden
    note = Column(String)