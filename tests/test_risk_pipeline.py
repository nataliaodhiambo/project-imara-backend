from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.models import AthleteBaseline
from app.services.ml_predictor import RiskPredictor, risk_level_for
from app.services.windowing_engine import compute_window_features, haversine_m

METRES_PER_DEG_LAT = 111_195


def _stream(athlete_id, session_id, *, minutes, hrv_ms, speed_m_s, step_s=10):
    start = datetime(2026, 10, 8, 9, 0, tzinfo=timezone.utc)
    step_deg = speed_m_s * step_s / METRES_PER_DEG_LAT
    return [
        {
            "athlete_id": athlete_id,
            "session_id": session_id,
            "timestamp": (start + timedelta(seconds=i * step_s)).isoformat(),
            "heart_rate": 170,
            "hrv_ms": hrv_ms,
            "latitude": -1.29 + i * step_deg,
            "longitude": 36.82,
            "speed_m_s": speed_m_s,
        }
        for i in range(minutes * 60 // step_s)
    ]


def _add_baseline(db_session, athlete_id):
    db_session.add(
        AthleteBaseline(
            athlete_id=athlete_id, calculation_date=date(2026, 10, 1),
            avg_28day_hrv=70, avg_28day_hsr=100, hsr_threshold_upper=150, hrv_threshold_lower=55,
        )
    )
    db_session.commit()


def test_haversine_one_degree_latitude():
    assert haversine_m(0, 0, 1, 0) == pytest.approx(METRES_PER_DEG_LAT, rel=1e-3)


def test_compute_window_features_hsr_split():
    samples = [
        SimpleNamespace(heart_rate=150, hrv_ms=60, speed_m_s=3.0, latitude=0.0, longitude=0.0),
        SimpleNamespace(heart_rate=160, hrv_ms=50, speed_m_s=6.0, latitude=0.001, longitude=0.0),
        SimpleNamespace(heart_rate=170, hrv_ms=40, speed_m_s=4.0, latitude=0.002, longitude=0.0),
    ]
    features = compute_window_features(samples)
    assert features["sample_count"] == 3
    assert features["max_heart_rate"] == 170
    assert features["avg_hrv_ms"] == 50
    assert features["total_distance_m"] == pytest.approx(222.4, abs=0.5)
    assert features["hsr_distance_m"] == pytest.approx(111.2, abs=0.5)


def test_risk_levels():
    assert risk_level_for(0.1) == "low"
    assert risk_level_for(0.5) == "moderate"
    assert risk_level_for(0.75) == "high"


def test_empty_model_file_falls_back_to_rules(tmp_path):
    empty = tmp_path / "model.pkl"
    empty.touch()
    assert RiskPredictor(model_path=empty).source == "rules"


def test_session_end_builds_windows_and_raises_alerts(client, db_session, athlete, training_session):
    athlete_id, session_id = athlete["athlete_id"], training_session["session_id"]
    _add_baseline(db_session, athlete_id)
    records = _stream(athlete_id, session_id, minutes=10, hrv_ms=40, speed_m_s=7.0)
    assert client.post("/api/v1/telemetry/ingest/batch", json={"records": records}).status_code == 201

    assert client.post(f"/api/v1/sessions/{session_id}/end", json={"actual_duration_mins": 10}).status_code == 200

    windows = client.get(f"/api/v1/sessions/{session_id}/windows").json()
    assert len(windows) == 2
    assert all(w["sample_count"] == 30 for w in windows)
    assert all(w["risk_level"] == "high" for w in windows)
    assert windows[0]["hrv_deviation_pct"] == pytest.approx(-42.86, abs=0.01)

    alerts = client.get("/api/v1/alerts", params={"athlete_id": athlete_id}).json()
    assert len(alerts) == 2
    assert "HRV" in alerts[0]["reason"] and "HSR" in alerts[0]["reason"]

    acked = client.patch(f"/api/v1/alerts/{alerts[0]['alert_id']}/acknowledge")
    assert acked.json()["acknowledged"] is True
    assert len(client.get("/api/v1/alerts", params={"unacknowledged_only": True}).json()) == 1


def test_low_load_session_is_low_risk(client, db_session, athlete, training_session):
    athlete_id, session_id = athlete["athlete_id"], training_session["session_id"]
    _add_baseline(db_session, athlete_id)
    records = _stream(athlete_id, session_id, minutes=5, hrv_ms=72, speed_m_s=3.0)
    for r in records:
        r["heart_rate"] = 130
    client.post("/api/v1/telemetry/ingest/batch", json={"records": records})

    windows = client.post(f"/api/v1/sessions/{session_id}/process").json()
    assert len(windows) == 1
    assert windows[0]["risk_level"] == "low"
    assert windows[0]["hsr_distance_m"] == 0
    assert client.get("/api/v1/alerts").json() == []


def test_reprocessing_is_idempotent(client, db_session, athlete, training_session):
    athlete_id, session_id = athlete["athlete_id"], training_session["session_id"]
    _add_baseline(db_session, athlete_id)
    records = _stream(athlete_id, session_id, minutes=5, hrv_ms=40, speed_m_s=7.0)
    client.post("/api/v1/telemetry/ingest/batch", json={"records": records})

    client.post(f"/api/v1/sessions/{session_id}/process")
    client.post(f"/api/v1/sessions/{session_id}/process")

    assert len(client.get(f"/api/v1/sessions/{session_id}/windows").json()) == 1
    assert len(client.get("/api/v1/alerts").json()) == 1
