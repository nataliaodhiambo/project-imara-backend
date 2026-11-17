from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FeatureWindowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    window_id: str
    athlete_id: str
    session_id: str
    window_start: datetime
    window_end: datetime
    sample_count: int
    avg_heart_rate: float
    max_heart_rate: int
    avg_hrv_ms: float
    avg_speed_m_s: float
    max_speed_m_s: float
    total_distance_m: float
    hsr_distance_m: float
    hrv_deviation_pct: float | None
    hsr_deviation_pct: float | None
    risk_score: float | None
    risk_level: str | None


class RiskAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    alert_id: str
    athlete_id: str
    session_id: str
    window_id: str
    risk_score: float
    risk_level: str
    reason: str
    acknowledged: bool
    created_at: datetime
