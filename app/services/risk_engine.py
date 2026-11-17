from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Athlete, AthleteBaseline, FeatureWindow5Min, RiskAlert, TrainingSession
from app.services.ml_predictor import RiskPredictor
from app.services.windowing_engine import build_feature_windows


def estimate_hr_max(date_of_birth: date, on: date) -> float:
    age = on.year - date_of_birth.year - ((on.month, on.day) < (date_of_birth.month, date_of_birth.day))
    return 208 - 0.7 * age  # Tanaka et al. (2001)


def latest_baseline(db: Session, athlete_id: str, on: date) -> AthleteBaseline | None:
    return db.scalars(
        select(AthleteBaseline)
        .where(AthleteBaseline.athlete_id == athlete_id, AthleteBaseline.calculation_date <= on)
        .order_by(AthleteBaseline.calculation_date.desc())
        .limit(1)
    ).first()


def _pct_change(value: float, reference: float) -> float | None:
    if reference == 0:
        return None
    return round((value - reference) / reference * 100, 2)


def process_session(db: Session, session: TrainingSession, predictor: RiskPredictor) -> list[FeatureWindow5Min]:
    """Window the session's telemetry, score every window and raise alerts for high-risk windows."""
    windows = build_feature_windows(db, session.session_id)

    athlete_ids = {w.athlete_id for w in windows}
    athletes = {a.athlete_id: a for a in db.scalars(select(Athlete).where(Athlete.athlete_id.in_(athlete_ids)))}
    baselines = {aid: latest_baseline(db, aid, session.session_date) for aid in athlete_ids}

    for window in windows:
        baseline = baselines[window.athlete_id]
        if baseline is not None:
            # Baseline HSR is stored per 5-minute window, matching hsr_distance_m
            window.hrv_deviation_pct = _pct_change(window.avg_hrv_ms, float(baseline.avg_28day_hrv))
            window.hsr_deviation_pct = _pct_change(window.hsr_distance_m, float(baseline.avg_28day_hsr))

        hr_max = estimate_hr_max(athletes[window.athlete_id].date_of_birth, session.session_date)
        prediction = predictor.predict(window, baseline, hr_max)
        window.risk_score = prediction.score
        window.risk_level = prediction.level

        if prediction.level == "high":
            reason = "; ".join(prediction.reasons) or f"Elevated {predictor.source} risk score"
            db.add(
                RiskAlert(
                    athlete_id=window.athlete_id,
                    session_id=session.session_id,
                    window_id=window.window_id,
                    risk_score=prediction.score,
                    risk_level=prediction.level,
                    reason=reason[:255],
                )
            )

    db.commit()
    return windows
