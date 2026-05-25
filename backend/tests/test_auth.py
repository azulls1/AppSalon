def test_protected_route_requires_token(client):
    r = client.get("/api/v1/profile/me")
    assert r.status_code == 401
    assert "Bearer" in r.json().get("detail", "")


def test_invalid_token_rejected(client):
    r = client.get("/api/v1/profile/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert r.status_code == 401


def test_cors_allows_frontend(client):
    r = client.options(
        "/api/v1/servicios",
        headers={
            "Origin": "http://localhost:4200",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert r.status_code in (200, 204)
    assert r.headers.get("access-control-allow-origin") == "http://localhost:4200"
