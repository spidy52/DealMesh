import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.api.voice import conversation_context

@pytest.mark.asyncio
async def test_negotiation_completion_and_proceed_decision():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register negotiation completed
        complete_resp = await ac.post("/api/voice/negotiation-completed", json={
            "product_name": "Titan Edge Ultra-Slim Minimalist Watch",
            "agreed_price": 2000,
            "original_price": 2499,
            "store_name": "DealMesh Store",
            "savings": 499
        })
        assert complete_resp.status_code == 200
        data = complete_resp.json()
        assert data["status"] == "success"
        assert "2,000" in data["reply"]
        assert conversation_context["awaiting_negotiation_decision"] is True
        assert conversation_context["negotiated_deal"]["agreed_price"] == 2000

        # 2. User says: "yeah proceed with the deal"
        chat_resp = await ac.post("/api/voice/chat", json={
            "message": "yeah proceed with the deal"
        })
        assert chat_resp.status_code == 200
        chat_data = chat_resp.json()
        assert chat_data["action"] == "deal_completed"
        assert "2,000" in chat_data["reply"]
        assert chat_data["deal_data"]["confirmed_price"] == 2000
        assert chat_data["deal_data"]["is_completed"] is True
        assert conversation_context["awaiting_negotiation_decision"] is False

@pytest.mark.asyncio
async def test_negotiation_completion_and_reject_other_deals():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register negotiation completed
        complete_resp = await ac.post("/api/voice/negotiation-completed", json={
            "product_name": "Titan Edge Ultra-Slim Minimalist Watch",
            "agreed_price": 1950,
            "original_price": 2499,
            "store_name": "DealMesh Store",
            "savings": 549
        })
        assert complete_resp.status_code == 200
        assert conversation_context["awaiting_negotiation_decision"] is True

        # 2. User says: "no check other deals"
        chat_resp = await ac.post("/api/voice/chat", json={
            "message": "no check other deals"
        })
        assert chat_resp.status_code == 200
        chat_data = chat_resp.json()
        assert chat_data["action"] == "show_deal_overlay"
        assert "Closing the negotiation" in chat_data["reply"]
        assert conversation_context["awaiting_negotiation_decision"] is False

@pytest.mark.asyncio
async def test_size_inquiry_not_mistaken_for_rejection():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        conversation_context["last_product_query"] = "online Best Shoes for Men"
        conversation_context["pending_confirmation"] = {
            "store": "Myntra",
            "url": "https://www.myntra.com/shoes",
            "price": 1199,
            "title": "Sid Online - Men Formal Loafers"
        }
        # User says "don't you want to know about my size"
        resp = await ac.post("/api/voice/chat", json={
            "message": "don't you want to know about my size"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["action"] == "show_variant_picker"
        assert "size" in data["reply"].lower()
        assert conversation_context["awaiting_variant_choice"] is True

@pytest.mark.asyncio
async def test_close_deal_session_resets_to_normal_state():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        conversation_context["last_product_query"] = "Titan Watch"
        conversation_context["pending_confirmation"] = {"store": "Titan", "price": 2499}
        conversation_context["awaiting_negotiation_decision"] = True

        resp = await ac.post("/api/voice/chat", json={
            "message": "close the deal"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["action"] == "close_all_overlays"
        assert "closed" in data["reply"].lower()
        assert conversation_context["pending_confirmation"] is None
        assert conversation_context["awaiting_negotiation_decision"] is False
        assert conversation_context["current_session_id"] is None

@pytest.mark.asyncio
async def test_conversation_session_continuity_single_chat():
    """Verify that multi-turn interactions (search -> clarification -> proceed -> confirm) stay in ONE session."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        conversation_context["current_session_id"] = None
        conversation_context["last_product_query"] = ""

        # Turn 1: User searches for Coffee Mug
        r1 = await ac.post("/api/voice/chat", json={"message": "I want to buy a coffee mug"})
        assert r1.status_code == 200
        sess_id_1 = conversation_context.get("current_session_id")
        assert sess_id_1 is not None

        # Turn 2: User says an off-hand greeting or clarification "Rashid"
        r2 = await ac.post("/api/voice/chat", json={"message": "Rashid"})
        assert r2.status_code == 200
        sess_id_2 = conversation_context.get("current_session_id")
        # Must still be the EXACT same session
        assert sess_id_2 == sess_id_1

        # Turn 3: User says "proceed"
        r3 = await ac.post("/api/voice/chat", json={"message": "proceed"})
        assert r3.status_code == 200
        sess_id_3 = conversation_context.get("current_session_id")
        assert sess_id_3 == sess_id_1

        # Check sessions list does not contain junk titles like "Rashid Deals" or "Proceed Deals"
        sess_list_resp = await ac.get("/api/voice/sessions")
        assert sess_list_resp.status_code == 200
        sessions = sess_list_resp.json()
        titles = [s["title"] for s in sessions]
        assert not any(t == "Rashid Deals" for t in titles)
        assert not any(t == "Proceed Deals" for t in titles)
        assert not any(t == "Yes Confirm Deals" for t in titles)


