import pytest


@pytest.fixture
def auth_header(client):
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Domain User", "email": "domain@example.com", "password": "password123"},
    )
    token = reg_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_inventory_crud_flow(client, auth_header):
    headers = auth_header

    add_resp = client.post(
        "/api/v1/inventory",
        headers=headers,
        json={
            "food_name": "Fresh Milk",
            "category": "Dairy",
            "quantity": 2.0,
            "unit": "L",
        },
    )
    assert add_resp.status_code == 201
    item_id = add_resp.json()["id"]
    assert add_resp.json()["food_name"] == "Fresh Milk"

    get_resp = client.get("/api/v1/inventory", headers=headers)
    assert get_resp.status_code == 200
    assert len(get_resp.json()) == 1

    put_resp = client.put(
        f"/api/v1/inventory/{item_id}",
        headers=headers,
        json={"quantity": 3.5},
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["quantity"] == 3.5

    del_resp = client.delete(f"/api/v1/inventory/{item_id}", headers=headers)
    assert del_resp.status_code == 204


def test_barcode_scan(client, auth_header):
    headers = auth_header

    scan_resp = client.post(
        "/api/v1/scan-barcode",
        headers=headers,
        json={"barcode": "0041331024523"},
    )
    assert scan_resp.status_code == 200
    data = scan_resp.json()
    assert data["found"] is True
    assert "Milk" in data["product_name"]


def test_recipes_recommendation(client, auth_header):
    headers = auth_header

    res_resp = client.get("/api/v1/recipes", headers=headers)
    assert res_resp.status_code == 200
    assert isinstance(res_resp.json(), list)


def test_notifications_list(client, auth_header):
    headers = auth_header

    notif_resp = client.get("/api/v1/notifications", headers=headers)
    assert notif_resp.status_code == 200


def test_chat_ai_assistant(client, auth_header):
    headers = auth_header

    chat_resp = client.post(
        "/api/v1/chat",
        headers=headers,
        json={"message": "What can I cook with milk and spinach?"},
    )
    assert chat_resp.status_code == 200
    assert "reply" in chat_resp.json()


def test_dashboard_metrics(client, auth_header):
    headers = auth_header

    dash_resp = client.get("/api/v1/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    assert "total_inventory_items" in dash_resp.json()
