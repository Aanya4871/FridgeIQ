import pytest


def test_register_user_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "securepassword123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["name"] == "Test User"


def test_register_duplicate_email_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "User 1",
            "email": "duplicate@example.com",
            "password": "password123",
        },
    )
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "User 2",
            "email": "duplicate@example.com",
            "password": "password456",
        },
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success_and_me_route(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Auth User",
            "email": "auth@example.com",
            "password": "password123",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "auth@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "auth@example.com"


def test_login_wrong_password(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Auth User",
            "email": "wrongpass@example.com",
            "password": "correctpassword",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "wrongpass@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401


def test_protected_route_without_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
