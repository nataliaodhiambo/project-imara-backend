from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.athlete import Athlete          # adjust to your path
from app.models.readiness import InferenceSnapshot, RecommendationLog
from app.services.readiness import compute_readiness
from app.services.recommendation import recommend

router = APIRouter(prefix="/athletes", tags=["recommendations"])


@router.get("/{athlete_id}/recommendation")
def get_recommendation(athlete_id: int, db: Session = Depends(get_db)):
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if athlete is None:
        raise HTTPException(404, "Athlete not found")

    snap = (db.query(InferenceSnapshot)
              .filter(InferenceSnapshot.athlete_id == athlete_id)
              .order_by(InferenceSnapshot.created_at.desc())
              .first())
    if snap is None:
        return {"status": "no_inference"}

    readiness = compute_readiness(db, athlete_id, date.today())
    rec = recommend(readiness, snap.acwr, snap.risk_band, bool(snap.perf_drop))
    return {
        "status": "ok",
        "source": snap.source,
        "risk_band": snap.risk_band,
        "risk_probability": snap.risk_probability,
        "acwr": snap.acwr,
        "perf_drop": bool(snap.perf_drop),
        "readiness_band": readiness["band"],
        **rec,
    }


class Decision(BaseModel):
    rule: str
    action: str
    decision: str            # accepted | overridden
    note: str = ""


@router.post("/{athlete_id}/recommendation/decision")
def log_decision(athlete_id: int, body: Decision, db: Session = Depends(get_db)):
    if body.decision not in ("accepted", "overridden"):
        raise HTTPException(422, "decision must be accepted or overridden")
    db.add(RecommendationLog(athlete_id=athlete_id, rule=body.rule, action=body.action,
                             decision=body.decision, note=body.note))
    db.commit()
    return {"status": "logged"}