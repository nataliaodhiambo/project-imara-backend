from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Athlete, RawTelemetry
from app.schemas.athlete import AthleteCreate, AthleteResponse, AthleteUpdate
from app.services.auth_service import get_current_user

# Mounted under v1_router's "/api/v1" prefix -> /api/v1/athletes
router = APIRouter(prefix="/athletes", tags=["Athletes"], dependencies=[Depends(get_current_user)])


def _get_athlete_or_404(db: Session, athlete_id: str) -> Athlete:
    athlete = db.get(Athlete, athlete_id)
    if athlete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")
    return athlete


@router.post("", response_model=AthleteResponse, status_code=status.HTTP_201_CREATED)
def create_athlete(payload: AthleteCreate, db: Session = Depends(get_db)):
    athlete = Athlete(**payload.model_dump())
    db.add(athlete)
    db.commit()
    db.refresh(athlete)
    return athlete


@router.get("", response_model=list[AthleteResponse])
def list_athletes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Athlete).order_by(Athlete.last_name, Athlete.first_name).offset(skip).limit(limit)
    ).all()


@router.get("/{athlete_id}", response_model=AthleteResponse)
def get_athlete(athlete_id: str, db: Session = Depends(get_db)):
    return _get_athlete_or_404(db, athlete_id)


@router.patch("/{athlete_id}", response_model=AthleteResponse)
def update_athlete(athlete_id: str, payload: AthleteUpdate, db: Session = Depends(get_db)):
    athlete = _get_athlete_or_404(db, athlete_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(athlete, field, value)
    db.commit()
    db.refresh(athlete)
    return athlete


@router.delete("/{athlete_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_athlete(athlete_id: str, db: Session = Depends(get_db)):
    athlete = _get_athlete_or_404(db, athlete_id)
    if db.scalar(select(exists().where(RawTelemetry.athlete_id == athlete_id))):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Athlete has recorded telemetry and cannot be deleted",
        )
    db.delete(athlete)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
