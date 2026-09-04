import pytest
import uuid
import datetime
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.agents.merchant_agent import MerchantAgent

client = TestClient(app)

def test_titanbot_privacy_boundary():
    """Verify that private reservation floor (e.g. 2299) is NEVER leaked in public DMCP responses."""
    resp = client.post("/agent/offer", json={
        "product_id": "watch_titan_001",
        "merchant_id": "merchant_titan_demo",
        "offer_amount": 2200.0,
        "currency": "INR",
        "agent_id": "Omni",
        "round_number": 1
    })
    assert resp.status_code == 200
    data = resp.json()
    # Ensure private floor fields are NOT present
    assert "absolute_floor" not in data
    assert "auto_negotiation_floor" not in data
    assert "preferred_price" not in data
    assert data["action"] in ["counter_offer", "waiting_for_approval", "accept_offer"]

def test_titanbot_pause_resume():
    """Verify 1-click pause switch stops autonomous concessions."""
    # 1. Pause TitanBot
    pause_res = client.post("/api/merchant/agent/toggle-pause?merchant_id=merchant_titan_demo")
    assert pause_res.status_code == 200
    assert pause_res.json()["is_paused"] is True

    # 2. TitanBot in paused state counters with listed price
    agent = MerchantAgent(agent_name="TitanBot", is_paused=True)
    eval_res = agent.evaluate_buyer_offer(
        product={"listed_price": 2799.0, "inventory": 10, "policy": {"preferred_price": 2500, "auto_negotiation_floor": 2400, "absolute_floor": 2299}},
        buyer_offer=2350.0,
        current_round=1
    )
    assert eval_res.counter_price == 2799.0
    assert "paused" in eval_res.reason.lower()

    # 3. Resume TitanBot
    resume_res = client.post("/api/merchant/agent/toggle-pause?merchant_id=merchant_titan_demo")
    assert resume_res.status_code == 200
    assert resume_res.json()["is_paused"] is False

def test_titanbot_human_approval_and_atomic_lock():
    """
    Simulates Section 28 & 29 flow:
    Buyer sends offer in human approval range (2,350) -> WAITING_FOR_APPROVAL.
    Merchant clicks APPROVE -> Deal locked atomically and inventory reserved.
    """
    start_res = client.post("/api/negotiations/start", json={
        "product_id": "watch_titan_001",
        "merchant_id": "merchant_titan_demo",
        "user_id": "user_buyer_test_titan"
    })
    assert start_res.status_code == 200
    data = start_res.json()
    neg_id = data["negotiation_id"]
    assert data["status"] == "WAITING_FOR_APPROVAL"
    assert data["approval_required"] is True

    # Check merchant feed
    feed_res = client.get("/api/merchant/negotiations?merchant_id=merchant_titan_demo")
    assert feed_res.status_code == 200
    feed = feed_res.json()
    assert len(feed) > 0
    top_item = feed[0]
    assert top_item["id"] == neg_id
    assert top_item["status"] == "WAITING_FOR_APPROVAL"
    # Private floor is visible to merchant dashboard only
    assert top_item["privateFloor"] == 2299.0

    # Merchant executes 1-click approval
    dec_res = client.post(f"/api/merchant/negotiations/{neg_id}/decision?merchant_id=merchant_titan_demo", json={
        "decision": "APPROVE",
        "approved_price": 2350.0
    })
    assert dec_res.status_code == 200
    assert dec_res.json()["status"] == "APPROVED"
    assert dec_res.json()["final_price"] == 2350.0

def test_titanbot_real_analytics_computation():
    """Verify analytics are computed live from SQLite database tables."""
    res = client.get("/api/merchant/analytics?merchant_id=merchant_titan_demo")
    assert res.status_code == 200
    data = res.json()
    assert "total_revenue" in data
    assert "orders_count" in data
    assert "aov" in data
    assert "conversion_rate" in data
    assert "agent_metrics" in data
    assert "revenue_by_product" in data
    assert "revenue_by_buyer" in data
    assert data["total_revenue"] > 0
    assert data["orders_count"] > 0

def test_live_arena_negotiation_market_profit_comparison():
    """Verify TitanBot autonomously compares live online prices and negotiates for merchant profit and buyer satisfaction."""
    res = client.post("/api/negotiations/live-arena", json={
        "product_name": "Luxury Crimson Red Velvet Rose Bouquet (Fresh Cut 12 Stems)",
        "listed_price": 799.0,
        "store_name": "DealMesh Store",
        "stores": [
            {"name": "Blinkit", "price": 405.0, "stock": "in stock", "is_in_stock": True, "perks": "10-min delivery"},
            {"name": "Bigbasket", "price": 309.0, "stock": "in stock", "is_in_stock": True, "perks": "Standard 500g"},
            {"name": "Nurserylive", "price": 249.0, "stock": "out of stock", "is_in_stock": False}
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "AGREED"
    assert "deal_ref" in data
    assert data["agreed_price"] < 799.0
    assert data["agreed_price"] >= data["cost_floor"]
    assert data["merchant_profit"] > 0
    assert len(data["transcript"]) == 4

    # Verify out-of-stock store Nurserylive is excluded
    store_names = [s["store"] for s in data["market_stores"]]
    assert "Nurserylive" not in store_names
    assert "Blinkit" in store_names
    assert "Bigbasket" in store_names
