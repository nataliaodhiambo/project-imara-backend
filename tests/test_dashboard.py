import pytest


def test_dashboard_serves_html(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "Project Imara | Dashboard" in response.text
    assert 'data-view="athletes"' in response.text


def test_documentation_routes_disabled(client):
    assert client.get("/docs").status_code == 404
    assert client.get("/redoc").status_code == 404
    assert client.get("/openapi.json").status_code == 200


def test_health_unchanged(client):
    assert client.get("/health").json() == {
        "status": "healthy", "service": "Project Imara Engine",
    }


@pytest.mark.parametrize("path", ["/api/v1/athletes", "/api/v1/sessions", "/api/v1/alerts"])
def test_dashboard_routes_require_bearer(public_client, path):
    response = public_client.get(path)
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"
    assert public_client.get(path, headers={"Authorization": "Bearer invalid"}).status_code == 401


@pytest.mark.parametrize("path", ["/api/v1/athletes", "/api/v1/sessions", "/api/v1/alerts"])
def test_dashboard_routes_accept_bearer(client, path):
    assert client.get(path).status_code == 200


@pytest.mark.parametrize("path,method", [
    ("/api/v1/auth/login", "POST"), ("/api/v1/athletes", "DELETE"),
    ("/api/v1/sessions", "GET"), ("/api/v1/alerts", "GET"),
])
def test_cors_accepts_authorization(public_client, path, method):
    response = public_client.options(path, headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": method,
        "Access-Control-Request-Headers": "authorization,content-type",
    })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "authorization" in response.headers["access-control-allow-headers"]