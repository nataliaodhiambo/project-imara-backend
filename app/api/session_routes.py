from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import FeatureWindow5Min, TrainingSession
from app.schemas.analytics import FeatureWindowResponse
from app.schemas.session import SessionCreate, SessionEnd, SessionResponse, SessionUpdate
from app.services.ml_predictor import RiskPredictor, get_predictor
from app.services.risk_engine import process_session
from app.services.auth_service import get_current_user

# Mounted under v1_router's "/api/v1" prefix -> /api/v1/sessions
router = APIRouter(prefix="/sessions", tags=["Sessions"], dependencies=[Depends(get_current_user)])


def _get_session_or_404(db: Session, session_id: str) -> TrainingSession:
    session = db.get(TrainingSession, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training session not found")
    return session


@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(payload: SessionCreate, db: Session = Depends(get_db)):
    session = TrainingSession(
        session_date=date.today(),
        drill_type=payload.drill_type,
        planned_duration_mins=payload.planned_duration_mins,
        intensity_target=payload.intensity_target,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=list[SessionResponse])
def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(TrainingSession)
        .order_by(TrainingSession.session_date.desc(), TrainingSession.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    return _get_session_or_404(db, session_id)


@router.patch("/{session_id}", response_model=SessionResponse)
def update_session(session_id: str, payload: SessionUpdate, db: Session = Depends(get_db)):
    session = _get_session_or_404(db, session_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/end", response_model=SessionResponse)
def end_session(
    session_id: str,
    payload: SessionEnd,
    db: Session = Depends(get_db),
    predictor: RiskPredictor = Depends(get_predictor),
):
    session = _get_session_or_404(db, session_id)
    session.actual_duration_mins = payload.actual_duration_mins
    process_session(db, session, predictor)
    db.refresh(session)
    return session


@router.post("/{session_id}/process", response_model=list[FeatureWindowResponse])
def process_session_windows(
    session_id: str,
    db: Session = Depends(get_db),
    predictor: RiskPredictor = Depends(get_predictor),
):
    return process_session(db, _get_session_or_404(db, session_id), predictor)


@router.get("/{session_id}/windows", response_model=list[FeatureWindowResponse])
def list_session_windows(session_id: str, db: Session = Depends(get_db)):
    _get_session_or_404(db, session_id)
    return db.scalars(
        select(FeatureWindow5Min)
        .where(FeatureWindow5Min.session_id == session_id)
        .order_by(FeatureWindow5Min.athlete_id, FeatureWindow5Min.window_start)
    ).all()
