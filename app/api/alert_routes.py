from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RiskAlert
from app.schemas.analytics import RiskAlertResponse
from app.services.auth_service import get_current_user

# Mounted under v1_router's "/api/v1" prefix -> /api/v1/alerts
router = APIRouter(prefix="/alerts", tags=["Risk Alerts"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[RiskAlertResponse])
def list_alerts(
    athlete_id: str | None = None,
    session_id: str | None = None,
    unacknowledged_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = select(RiskAlert)
    if athlete_id is not None:
        query = query.where(RiskAlert.athlete_id == athlete_id)
    if session_id is not None:
        query = query.where(RiskAlert.session_id == session_id)
    if unacknowledged_only:
        query = query.where(RiskAlert.acknowledged.is_(False))
    return db.scalars(query.order_by(RiskAlert.created_at.desc()).offset(skip).limit(limit)).all()


@router.patch("/{alert_id}/acknowledge", response_model=RiskAlertResponse)
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.get(RiskAlert, alert_id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk alert not found")
    alert.acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert
