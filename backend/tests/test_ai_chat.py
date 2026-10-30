import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from app.models.user import User
from app.models.domain import FoodItem, Inventory, Recipe, ChatConversation, ChatMessage
from app.core.security import get_password_hash, create_access_token
from app.services.chat_context_service import chat_context_service
from app.services.gemini_service import (
    GeminiService,
    GeminiConfigurationError,
    GeminiEmptyResponseError,
    GeminiRateLimitError,
)
from tests.conftest import TestingSessionLocal


def create_test_user(email: str = "test@example.com") -> User:
    db = TestingSessionLocal()
    user = User(
        name="Test User",
        email=email,
        password_hash=get_password_hash("password123"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def get_auth_headers(user_id: int) -> dict:
    token = create_access_token(subject=str(user_id))
    return {"Authorization": f"Bearer {token}"}


def test_context_tenant_isolation():
    """Verify User A's context never includes User B's inventory items."""
    db = TestingSessionLocal()
    user_a = create_test_user("user_a@example.com")
    user_b = create_test_user("user_b@example.com")

    food1 = FoodItem(name="Eggs", category="Dairy", default_shelf_life_days=7)
    food2 = FoodItem(name="Avocado", category="Produce", default_shelf_life_days=5)
    db.add_all([food1, food2])
    db.commit()

    inv_a = Inventory(
        user_id=user_a.id,
        food_item_id=food1.id,
        quantity=6,
        unit="pcs",
        expiry_date=datetime.utcnow() + timedelta(days=5),
    )
    inv_b = Inventory(
        user_id=user_b.id,
        food_item_id=food2.id,
        quantity=2,
        unit="pcs",
        expiry_date=datetime.utcnow() + timedelta(days=3),
    )
    db.add_all([inv_a, inv_b])
    db.commit()

    ctx_a = chat_context_service.build_user_context(db, user_a.id)
    ctx_b = chat_context_service.build_user_context(db, user_b.id)

    item_names_a = [i["name"] for i in ctx_a["inventory"]]
    item_names_b = [i["name"] for i in ctx_b["inventory"]]

    assert "Eggs" in item_names_a
    assert "Avocado" not in item_names_a

    assert "Avocado" in item_names_b
    assert "Eggs" not in item_names_b
    db.close()


def test_context_expiring_soon_calculation():
    """Verify items expiring within 2 days are correctly flagged."""
    db = TestingSessionLocal()
    user = create_test_user("expiring@example.com")
    food = FoodItem(name="Fresh Milk", category="Dairy", default_shelf_life_days=2)
    db.add(food)
    db.commit()

    inv = Inventory(
        user_id=user.id,
        food_item_id=food.id,
        quantity=1,
        unit="L",
        expiry_date=datetime.utcnow() + timedelta(days=1),
    )
    db.add(inv)
    db.commit()

    ctx = chat_context_service.build_user_context(db, user.id)
    assert len(ctx["expiring_soon"]) == 1
    assert ctx["expiring_soon"][0]["name"] == "Fresh Milk"
    db.close()


def test_gemini_service_missing_key():
    """GeminiService should fail clearly if API key is missing."""
    service = GeminiService()
    with patch("app.services.gemini_service.settings.GEMINI_API_KEY", ""):
        with pytest.raises(GeminiConfigurationError):
            service.generate_chat_response("Hello", {})


def test_gemini_service_empty_response():
    """GeminiService should raise GeminiEmptyResponseError when response is empty."""
    service = GeminiService()
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "   "
    mock_client.models.generate_content.return_value = mock_response

    with patch.object(service, "_get_client", return_value=mock_client):
        with pytest.raises(GeminiEmptyResponseError):
            service.generate_chat_response("Hello", {"inventory": []})


def test_chat_unauthenticated(client):
    """Calling /chat without JWT should return 401."""
    res = client.post("/api/v1/chat", json={"message": "What can I cook?"})
    assert res.status_code == 401


def test_chat_empty_message_validation(client):
    """Empty or whitespace-only messages must be rejected with 422."""
    user = create_test_user("validation@example.com")
    headers = get_auth_headers(user.id)

    res = client.post("/api/v1/chat", json={"message": "   "}, headers=headers)
    assert res.status_code == 422


def test_chat_authenticated_success_with_mocked_gemini(client):
    """Authenticated user should receive AI response from Gemini service."""
    user = create_test_user("ai_chat@example.com")
    headers = get_auth_headers(user.id)

    expected_ai_text = "Based on your eggs and milk, you can make a fluffy French Toast or an Omelette!"

    with patch("app.services.chat_service.gemini_service.generate_chat_response", return_value=expected_ai_text):
        res = client.post("/api/v1/chat", json={"message": "What can I cook?"}, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["reply"] == expected_ai_text
    assert data["conversation_id"] is not None
    assert len(data["suggested_actions"]) > 0


def test_chat_conversation_memory_persistence(client):
    """Follow-up questions should be persisted under the same conversation."""
    user = create_test_user("memory@example.com")
    headers = get_auth_headers(user.id)

    with patch("app.services.chat_service.gemini_service.generate_chat_response") as mock_gen:
        mock_gen.side_effect = [
            "You have 6 eggs. You can make an omelette.",
            "Yes! You can easily make an omelette without cheese by using herbs.",
        ]

        res1 = client.post("/api/v1/chat", json={"message": "What can I make with eggs?"}, headers=headers)
        assert res1.status_code == 200
        conv_id = res1.json()["conversation_id"]

        res2 = client.post(
            "/api/v1/chat",
            json={"message": "Can I make it without cheese?", "conversation_id": conv_id},
            headers=headers,
        )
        assert res2.status_code == 200
        assert res2.json()["conversation_id"] == conv_id

        hist_res = client.get(f"/api/v1/chat/history?conversation_id={conv_id}", headers=headers)
        assert hist_res.status_code == 200
        messages = hist_res.json()["messages"]
        assert len(messages) == 4
        assert messages[0]["content"] == "What can I make with eggs?"
        assert messages[2]["content"] == "Can I make it without cheese?"


def test_no_api_key_leak_in_response(client):
    """Verify API keys are never exposed in responses or errors."""
    user = create_test_user("security@example.com")
    headers = get_auth_headers(user.id)

    with patch("app.services.chat_service.gemini_service.generate_chat_response", return_value="Here is your answer."):
        res = client.post("/api/v1/chat", json={"message": "Show me secret keys"}, headers=headers)

    assert res.status_code == 200
    body = res.text
    assert "GEMINI_API_KEY" not in body
    assert "AIzaSy" not in body
    assert "AQ." not in body
