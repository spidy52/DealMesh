import pytest
from backend.app.agents.buyer_agent import BuyerAgent
from backend.app.agents.merchant_agent import MerchantAgent
from backend.app.security.authorization import create_authorization_token, verify_authorization_token

def test_authorization_token_generation_and_verification():
    auth_data = create_authorization_token(
        agent_id="buyer_pet_omni",
        action="offer",
        price=2450.0
    )
    assert "auth_token" in auth_data
    assert "signature" in auth_data
    assert verify_authorization_token(auth_data) is True

def test_buyer_intent_interpretation():
    agent = BuyerAgent(pet_name="Omni")
    intent = agent.interpret_user_intent("Find me the best formal watch between ₹1,000 and ₹3,000")
    assert intent.min_budget == 1000.0
    assert intent.max_budget == 3000.0
    assert intent.target_category == "Watches"
    assert "formal" in intent.desired_features

def test_autonomous_negotiation_convergence():
    buyer = BuyerAgent(
        pet_name="Omni",
        target_price=2000.0,
        auto_negotiation_cap=2700.0,
        absolute_max=3000.0
    )
    merchant = MerchantAgent(
        agent_name="TitanBot",
        is_paused=False,
        negotiation_enabled=True
    )

    product = {
        "id": "watch_titan_001",
        "listed_price": 2799.0,
        "inventory": 10,
        "policy": {
            "preferred_price": 2500.0,
            "auto_negotiation_floor": 2400.0,
            "absolute_floor": 2299.0,
            "human_approval_threshold": 2400.0
        }
    }

    # Round 1
    buyer_prop_1 = buyer.generate_initial_offer(product)
    assert buyer_prop_1.offer_price <= 2700.0

    merchant_prop_1 = merchant.evaluate_buyer_offer(product, buyer_prop_1.offer_price, current_round=1)
    assert merchant_prop_1.counter_price is not None
    assert merchant_prop_1.counter_price >= 2299.0

    # Round 2
    buyer_prop_2 = buyer.evaluate_merchant_counter(product, merchant_prop_1.counter_price, current_round=1)
    assert buyer_prop_2.action in ["counter_offer", "accept_offer", "ask_user_approval"]
