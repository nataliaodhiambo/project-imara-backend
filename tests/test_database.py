from datetime import date, datetime, timezone

from sqlalchemy.orm import configure_mappers

from app.models import Athlete, FeatureWindow5Min, RawTelemetry, RiskAlert, TrainingSession


def test_all_mappers_configure():
    configure_mappers()


def test_relationships_round_trip(db_session):
    athlete = Athlete(first_name="Amani", last_name="Otieno", position="Winger", date_of_birth=date(2000, 5, 14))
    session = TrainingSession(
        session_date=date(2026, 10, 8), drill_type="Sprints", planned_duration_mins=45, intensity_target="high"
    )
    db_session.add_all([athlete, session])
    db_session.flush()

    ts = datetime(2026, 10, 8, 9, 0, tzinfo=timezone.utc)
    telemetry = RawTelemetry(
        athlete_id=athlete.athlete_id, session_id=session.session_id, timestamp=ts,
        heart_rate=150, hrv_ms=60.0, latitude=-1.29, longitude=36.82, speed_m_s=4.0,
    )
    window = FeatureWindow5Min(
        athlete_id=athlete.athlete_id, session_id=session.session_id, window_start=ts, window_end=ts,
        sample_count=1, avg_heart_rate=150, max_heart_rate=150, avg_hrv_ms=60, avg_speed_m_s=4,
        max_speed_m_s=4, total_distance_m=0, hsr_distance_m=0,
    )
    db_session.add_all([telemetry, window])
    db_session.flush()
    alert = RiskAlert(
        athlete_id=athlete.athlete_id, session_id=session.session_id, window_id=window.window_id,
        risk_score=0.9, risk_level="high", reason="test",
    )
    db_session.add(alert)
    db_session.commit()

    db_session.refresh(athlete)
    assert athlete.telemetry_logs == [telemetry]
    assert athlete.feature_windows == [window]
    assert athlete.alerts == [alert]
    assert session.telemetry_logs == [telemetry]
    assert window.alerts == [alert]
    assert alert.acknowledged is False
