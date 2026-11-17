from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Athlete, RawTelemetry, TrainingSession
from app.schemas.telemetry import (
    TelemetryBatchIngestRequest,
    TelemetryBatchResponse,
    TelemetryIngestRequest,
    TelemetryResponse,
)

# Mounted under v1_router's "/api/v1" prefix -> /api/v1/telemetry
router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


def _ensure_references_exist(db: Session, athlete_ids: set[str], session_ids: set[str]) -> None:
    """Reject unknown IDs with a 404 instead of relying on DB FK errors (not enforced on SQLite)."""
    known_athletes = set(db.scalars(select(Athlete.athlete_id).where(Athlete.athlete_id.in_(athlete_ids))))
    if missing := athlete_ids - known_athletes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown athlete_id(s): {sorted(missing)}")

    known_sessions = set(
        db.scalars(select(TrainingSession.session_id).where(TrainingSession.session_id.in_(session_ids)))
    )
    if missing := session_ids - known_sessions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown session_id(s): {sorted(missing)}")


@router.post("/ingest", response_model=TelemetryResponse, status_code=status.HTTP_201_CREATED)
def ingest_telemetry(payload: TelemetryIngestRequest, db: Session = Depends(get_db)):
    _ensure_references_exist(db, {payload.athlete_id}, {payload.session_id})
    record = RawTelemetry(**payload.model_dump())
    db.add(record)
    db.commit()
    return TelemetryResponse(
        status="success",
        message="Telemetry record ingested",
        record_id=record.telemetry_id,
    )


@router.post("/ingest/batch", response_model=TelemetryBatchResponse, status_code=status.HTTP_201_CREATED)
def ingest_telemetry_batch(payload: TelemetryBatchIngestRequest, db: Session = Depends(get_db)):
    _ensure_references_exist(
        db,
        {r.athlete_id for r in payload.records},
        {r.session_id for r in payload.records},
    )
    records = [RawTelemetry(**r.model_dump()) for r in payload.records]
    db.add_all(records)
    db.flush()
    record_ids = [r.telemetry_id for r in records]
    db.commit()
    return TelemetryBatchResponse(
        status="success",
        message=f"Ingested {len(records)} telemetry records",
        ingested_count=len(records),
        record_ids=record_ids,
    )
