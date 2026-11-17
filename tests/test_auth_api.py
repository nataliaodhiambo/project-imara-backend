from datetime import datetime, timedelta, timezone

import jwt
import pytest
from sqlalchemy import select

from app.config import settings
from app.models.user import User
from app.services.auth_service import create_access_token, verify_password


@pytest.fixture
def client(public_client):
    return public_client


@pytest.fixture
def staff(client):
    payload = {
        "email": "coach@example.com", "password": "StrongPass123!",
        "full_name": "Imara Coach", "role": "COACH",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return payload, response.json()


def test_register_hashes_password_and_hides_it(client, db_session, staff):
    payload, profile = staff
    assert "password" not in profile and "hashed_password" not in profile
    user = db_session.scalar(select(User).where(User.email == payload["email"]))
    assert user.hashed_password != payload["password"]
    assert verify_password(payload["password"], user.hashed_password)
    payload["email"] = "COACH@example.com"
    assert client.post("/api/v1/auth/register", json=payload).status_code == 409
    assert client.get("/api/v1/auth/me").status_code == 401


def test_json_login_and_me(client, staff):
    payload, profile = staff
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    token = response.json()
    assert token["token_type"] == "bearer"
    claims = jwt.decode(token["access_token"], settings.SECRET_KEY, algorithms=["HS256"])
    assert claims["sub"] == profile["id"]
    assert claims["exp"] > claims["iat"]
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token['access_token']}"})
    assert response.status_code == 200
    assert response.json() == profile


def test_oauth2_login_and_openapi(client, staff):
    payload, _ = staff
    response = client.post("/api/v1/auth/token", data={"username": payload["email"], "password": payload["password"]})
    assert response.status_code == 200
    schema = client.get("/openapi.json").json()
    flow = schema["components"]["securitySchemes"]["OAuth2PasswordBearer"]["flows"]["password"]
    assert flow["tokenUrl"] == "/api/v1/auth/token"
    assert schema["paths"]["/api/v1/auth/me"]["get"]["security"]
    assert "/api/v1/api/v1/auth/login" not in schema["paths"]
    assert "--pink" in client.get("/").text


@pytest.mark.parametrize("email,password", [("coach@example.com", "wrong"), ("missing@example.com", "StrongPass123!")])
def test_bad_credentials(client, staff, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


@pytest.mark.parametrize("kind", ["expired", "tampered", "missing_user", "missing_exp", "garbage"])
def test_invalid_tokens(client, staff, kind):
    _, profile = staff
    now = datetime.now(timezone.utc)
    if kind == "expired":
        token = jwt.encode({"sub": profile["id"], "iat": now - timedelta(hours=2), "exp": now - timedelta(hours=1)}, settings.SECRET_KEY, algorithm="HS256")
    elif kind == "tampered":
        token = jwt.encode({"sub": profile["id"], "iat": now, "exp": now + timedelta(hours=1)}, "wrong-key", algorithm="HS256")
    elif kind == "missing_user":
        token = create_access_token({"sub": "missing-user"})
    elif kind == "missing_exp":
        token = jwt.encode({"sub": profile["id"], "iat": now}, settings.SECRET_KEY, algorithm="HS256")
    else:
        token = "not-a-token"
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


@pytest.mark.parametrize("change", [{"email": "invalid"}, {"password": "short"}, {"password": "x" * 73}, {"password": "\u00e9" * 37}, {"full_name": "   "}, {"role": "UNKNOWN"}])
def test_registration_validation(client, change):
    payload = {"email": "new@example.com", "password": "StrongPass123!", "full_name": "Imara Coach", "role": "COACH"}
    payload.update(change)
    assert client.post("/api/v1/auth/register", json=payload).status_code == 422