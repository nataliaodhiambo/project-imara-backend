def test_athlete_crud(client, athlete):
    athlete_id = athlete["athlete_id"]

    assert client.get(f"/api/v1/athletes/{athlete_id}").json()["first_name"] == "Amani"
    assert [a["athlete_id"] for a in client.get("/api/v1/athletes").json()] == [athlete_id]

    updated = client.patch(f"/api/v1/athletes/{athlete_id}", json={"position": "Striker"})
    assert updated.status_code == 200
    assert updated.json()["position"] == "Striker"
    assert updated.json()["last_name"] == "Otieno"

    assert client.delete(f"/api/v1/athletes/{athlete_id}").status_code == 204
    assert client.get(f"/api/v1/athletes/{athlete_id}").status_code == 404


def test_athlete_validation(client):
    response = client.post(
        "/api/v1/athletes",
        json={"first_name": "", "last_name": "X", "position": "Winger", "date_of_birth": "2000-01-01"},
    )
    assert response.status_code == 422


def test_cannot_delete_athlete_with_telemetry(client, athlete, training_session):
    client.post(
        "/api/v1/telemetry/ingest",
        json={
            "athlete_id": athlete["athlete_id"], "session_id": training_session["session_id"],
            "timestamp": "2026-10-08T09:00:00Z", "heart_rate": 140, "hrv_ms": 60,
            "latitude": -1.29, "longitude": 36.82, "speed_m_s": 3,
        },
    )
    assert client.delete(f"/api/v1/athletes/{athlete['athlete_id']}").status_code == 409


def test_session_list_update_and_end(client, training_session):
    session_id = training_session["session_id"]
    assert training_session["planned_duration_mins"] == 60
    assert training_session["actual_duration_mins"] is None

    assert [s["session_id"] for s in client.get("/api/v1/sessions").json()] == [session_id]

    updated = client.patch(f"/api/v1/sessions/{session_id}", json={"intensity_target": "moderate"})
    assert updated.json()["intensity_target"] == "moderate"

    ended = client.post(f"/api/v1/sessions/{session_id}/end", json={"actual_duration_mins": 55})
    assert ended.status_code == 200
    assert ended.json()["actual_duration_mins"] == 55


def test_session_not_found(client):
    assert client.get("/api/v1/sessions/missing").status_code == 404
    assert client.patch("/api/v1/sessions/missing", json={}).status_code == 404
    assert client.post("/api/v1/sessions/missing/end", json={"actual_duration_mins": 5}).status_code == 404
