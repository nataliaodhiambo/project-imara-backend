from datetime import date, timedelta
from statistics import mean, pstdev
from sqlalchemy.orm import Session
from app.models.readiness import DailyReadiness

BASELINE_DAYS = 28
MIN_BASELINE_DAYS = 7
HRV_Z_FLAG = -1.0          # standard deviations below personal baseline
HRV_Z_STRONG = -1.5
RHR_DELTA_FLAG = 5.0       # bpm above personal baseline
SLEEP_DELTA_FLAG = -60.0   # minutes below personal baseline


def _baseline(values):
    vals = [v for v in values if v is not None]
    if len(vals) < MIN_BASELINE_DAYS:
        return None, None
    return mean(vals), (pstdev(vals) or 1e-6)


def compute_readiness(db: Session, athlete_id: int, day: date) -> dict:
    empty = {"available": False, "band": "unknown", "flags": [],
             "hrv_z": None, "rhr_delta": None, "sleep_delta": None}

    today = (db.query(DailyReadiness)
               .filter(DailyReadiness.athlete_id == athlete_id, DailyReadiness.day == day)
               .first())
    if today is None:
        return empty

    history = (db.query(DailyReadiness)
                 .filter(DailyReadiness.athlete_id == athlete_id,
                         DailyReadiness.day < day,
                         DailyReadiness.day >= day - timedelta(days=BASELINE_DAYS))
                 .all())

    hrv_m, hrv_sd = _baseline([h.hrv_rmssd for h in history])
    rhr_m, _ = _baseline([h.resting_hr for h in history])
    slp_m, _ = _baseline([h.sleep_minutes for h in history])

    hrv_z = None
    if hrv_m is not None and today.hrv_rmssd is not None:
        hrv_z = (today.hrv_rmssd - hrv_m) / hrv_sd
    rhr_delta = None
    if rhr_m is not None and today.resting_hr is not None:
        rhr_delta = today.resting_hr - rhr_m
    sleep_delta = None
    if slp_m is not None and today.sleep_minutes is not None:
        sleep_delta = today.sleep_minutes - slp_m

    if hrv_z is None and rhr_delta is None and sleep_delta is None:
        return {**empty, "available": True}   # row exists, baseline still too short

    flags = []
    if hrv_z is not None and hrv_z <= HRV_Z_FLAG:
        flags.append("HRV below personal baseline")
    if rhr_delta is not None and rhr_delta >= RHR_DELTA_FLAG:
        flags.append("Resting heart rate above baseline")
    if sleep_delta is not None and sleep_delta <= SLEEP_DELTA_FLAG:
        flags.append("Sleep shorter than usual")

    strong_hrv = hrv_z is not None and hrv_z <= HRV_Z_STRONG
    band = "suppressed" if (len(flags) >= 2 or strong_hrv) else "normal"
    return {"available": True, "band": band, "flags": flags,
            "hrv_z": hrv_z, "rhr_delta": rhr_delta, "sleep_delta": sleep_delta}