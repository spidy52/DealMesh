import pytest
from backend.app.security.policy_engine import PolicyEngine

def test_buyer_policy_within_cap():
    res = PolicyEngine.evaluate_buyer_action(
        proposed_price=2400.0,
        target_price=2000.0,
        auto_negotiation_cap=2700.0,
        absolute_max=3000.0
    )
    assert res.decision == "ALLOW"
    assert res.authorized is True
    assert res.requires_user_approval is False

def test_buyer_policy_above_auto_cap_triggers_review():
    res = PolicyEngine.evaluate_buyer_action(
        proposed_price=2750.0,
        target_price=2000.0,
        auto_negotiation_cap=2700.0,
        absolute_max=3000.0
    )
    assert res.decision == "REVIEW"
    assert res.authorized is True
    assert res.requires_user_approval is True

def test_buyer_policy_above_absolute_max_blocks():
    res = PolicyEngine.evaluate_buyer_action(
        proposed_price=3200.0,
        target_price=2000.0,
        auto_negotiation_cap=2700.0,
        absolute_max=3000.0
    )
    assert res.decision == "BLOCK"
    assert res.authorized is False

def test_merchant_policy_within_auto_floor():
    res = PolicyEngine.evaluate_merchant_action(
        offered_price=2500.0,
        listed_price=2799.0,
        preferred_price=2500.0,
        auto_negotiation_floor=2400.0,
        absolute_floor=2300.0,
        human_approval_threshold=2400.0
    )
    assert res.decision == "ALLOW"
    assert res.authorized is True

def test_merchant_policy_below_absolute_floor_blocks():
    res = PolicyEngine.evaluate_merchant_action(
        offered_price=2100.0,
        listed_price=2799.0,
        preferred_price=2500.0,
        auto_negotiation_floor=2400.0,
        absolute_floor=2300.0,
        human_approval_threshold=2400.0
    )
    assert res.decision == "BLOCK"
    assert res.authorized is False
