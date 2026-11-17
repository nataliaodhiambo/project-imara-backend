from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.database import Base, get_db
from app.main import app
from app.services.ml_predictor import RiskPredictor, get_predictor
from app.models.user import User, UserRole
from app.services.auth_service import create_access_token, hash_password


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )

    @event.listens_for(engine, "connect")
    def _enable_foreign_keys(dbapi_connection, _):
        dbapi_connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, autoflush=False)()
    yield session
    session.close()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def public_client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    # Force rule-based scoring so tests don't depend on the trained artifact
    app.dependency_overrides[get_predictor] = lambda: RiskPredictor(model_path=Path("missing.pkl"))
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def client(public_client, db_session):
    user = User(
        email="test-staff@example.com", hashed_password=hash_password("TestStaffPassword!"),
        full_name="Test Staff", role=UserRole.COACH,
    )
    db_session.add(user)
    db_session.commit()
    public_client.headers["Authorization"] = f"Bearer {create_access_token({'sub': user.id})}"
    return public_client


@pytest.fixture
def athlete(client):
    response = client.post(
        "/api/v1/athletes",
        json={"first_name": "Amani", "last_name": "Otieno", "position": "Winger", "date_of_birth": "2000-05-14"},
    )
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def training_session(client):
    response = client.post(
        "/api/v1/sessions/start",
        json={"drill_type": "Small-sided games", "planned_duration_mins": 60, "intensity_target": "high"},
    )
    assert response.status_code == 201
    return response.json()
