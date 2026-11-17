from datetime import datetime

from pydantic import BaseModel, Field

MAX_BATCH_SIZE = 500


class TelemetryIngestRequest(BaseModel):
    athlete_id: str = Field(min_length=1, max_length=64)
    session_id: str = Field(min_length=1, max_length=64)
    timestamp: datetime
    heart_rate: int = Field(ge=20, le=250)
    hrv_ms: float = Field(gt=0, le=500)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    speed_m_s: float = Field(ge=0, le=15)


class TelemetryResponse(BaseModel):
    status: str
    message: str
    record_id: str


class TelemetryBatchIngestRequest(BaseModel):
    records: list[TelemetryIngestRequest] = Field(min_length=1, max_length=MAX_BATCH_SIZE)


class TelemetryBatchResponse(BaseModel):
    status: str
    message: str
    ingested_count: int
    record_ids: list[str]
