def _sample(athlete_id, session_id, **overrides):
    payload = {
        "athlete_id": athlete_id,
        "session_id": session_id,
        "timestamp": "2026-10-08T09:00:00Z",
        "heart_rate": 152,
        "hrv_ms": 62.5,
        "latitude": -1.2921,
        "longitude": 36.8219,
        "speed_m_s": 4.2,
    }
    payload.update(overrides)
    return payload


def test_ingest_single_record(client, athlete, training_session):
    response = client.post(
        "/api/v1/telemetry/ingest", json=_sample(athlete["athlete_id"], training_session["session_id"])
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "success"
    assert body["record_id"]


def test_ingest_unknown_session_returns_404(client, athlete):
    response = client.post("/api/v1/telemetry/ingest", json=_sample(athlete["athlete_id"], "does-not-exist"))
    assert response.status_code == 404
    assert "session_id" in response.json()["detail"]


def test_ingest_rejects_out_of_range_values(client, athlete, training_session):
    response = client.post(
        "/api/v1/telemetry/ingest",
        json=_sample(athlete["athlete_id"], training_session["session_id"], heart_rate=400, latitude=120),
    )
    assert response.status_code == 422


def test_batch_ingest(client, athlete, training_session):
    records = [
        _sample(athlete["athlete_id"], training_session["session_id"], timestamp=f"2026-10-08T09:00:{i:02d}Z")
        for i in range(10)
    ]
    response = client.post("/api/v1/telemetry/ingest/batch", json={"records": records})
    assert response.status_code == 201
    body = response.json()
    assert body["ingested_count"] == 10
    assert len(set(body["record_ids"])) == 10


def test_batch_ingest_is_atomic_on_unknown_athlete(client, athlete, training_session, db_session):
    from app.models import RawTelemetry

    records = [
        _sample(athlete["athlete_id"], training_session["session_id"]),
        _sample("ghost-athlete", training_session["session_id"]),
    ]
    response = client.post("/api/v1/telemetry/ingest/batch", json={"records": records})
    assert response.status_code == 404
    assert db_session.query(RawTelemetry).count() == 0


def test_batch_ingest_limits(client, athlete, training_session):
    assert client.post("/api/v1/telemetry/ingest/batch", json={"records": []}).status_code == 422
    too_many = [_sample(athlete["athlete_id"], training_session["session_id"])] * 501
    assert client.post("/api/v1/telemetry/ingest/batch", json={"records": too_many}).status_code == 422
