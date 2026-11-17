import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import FeatureWindow5Min, RawTelemetry, RiskAlert

WINDOW_LENGTH = timedelta(minutes=5)
HSR_THRESHOLD_M_S = 5.5  # 19.8 km/h, standard high-speed running cutoff
EARTH_RADIUS_M = 6_371_000


def to_utc_naive(ts: datetime) -> datetime:
    """SQLite drops tzinfo, so normalise everything to naive UTC before arithmetic."""
    if ts.tzinfo is None:
        return ts
    return ts.astimezone(timezone.utc).replace(tzinfo=None)


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = phi2 - phi1
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def compute_window_features(samples: list[RawTelemetry]) -> dict:
    """Aggregate a time-ordered list of samples from a single athlete into window features."""
    count = len(samples)
    total_distance = 0.0
    hsr_distance = 0.0
    for prev, cur in zip(samples, samples[1:]):
        segment = haversine_m(prev.latitude, prev.longitude, cur.latitude, cur.longitude)
        total_distance += segment
        if cur.speed_m_s >= HSR_THRESHOLD_M_S:
            hsr_distance += segment

    return {
        "sample_count": count,
        "avg_heart_rate": round(sum(s.heart_rate for s in samples) / count, 2),
        "max_heart_rate": max(s.heart_rate for s in samples),
        "avg_hrv_ms": round(sum(s.hrv_ms for s in samples) / count, 2),
        "avg_speed_m_s": round(sum(s.speed_m_s for s in samples) / count, 3),
        "max_speed_m_s": max(s.speed_m_s for s in samples),
        "total_distance_m": round(total_distance, 2),
        "hsr_distance_m": round(hsr_distance, 2),
    }


def build_feature_windows(db: Session, session_id: str) -> list[FeatureWindow5Min]:
    """Rebuild all 5-minute windows for a session. Existing windows and alerts are replaced."""
    db.execute(delete(RiskAlert).where(RiskAlert.session_id == session_id))
    db.execute(delete(FeatureWindow5Min).where(FeatureWindow5Min.session_id == session_id))

    rows = db.scalars(
        select(RawTelemetry)
        .where(RawTelemetry.session_id == session_id)
        .order_by(RawTelemetry.athlete_id, RawTelemetry.timestamp)
    ).all()

    by_athlete: dict[str, list[RawTelemetry]] = defaultdict(list)
    for row in rows:
        by_athlete[row.athlete_id].append(row)

    windows: list[FeatureWindow5Min] = []
    for athlete_id, samples in by_athlete.items():
        origin = to_utc_naive(samples[0].timestamp)
        buckets: dict[int, list[RawTelemetry]] = defaultdict(list)
        for sample in samples:
            buckets[(to_utc_naive(sample.timestamp) - origin) // WINDOW_LENGTH].append(sample)

        for index in sorted(buckets):
            start = origin + index * WINDOW_LENGTH
            windows.append(
                FeatureWindow5Min(
                    athlete_id=athlete_id,
                    session_id=session_id,
                    window_start=start,
                    window_end=start + WINDOW_LENGTH,
                    **compute_window_features(buckets[index]),
                )
            )

    db.add_all(windows)
    db.flush()
    return windows
