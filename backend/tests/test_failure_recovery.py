import pytest
import datetime
from backend.app.agents.recovery_agent import RecoveryAgent

def test_failure_recovery_retry_attempt_1():
    deal_data = {
        "final_price": 2299.0,
        "status": "FAILED",
        "expires_at": datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    }
    prod_data = {"inventory": 5}
    buyer_policy = {"auto_negotiation_cap": 2700.0, "absolute_max": 3000.0}

    res = RecoveryAgent.handle_payment_failure(
        deal_data=deal_data,
        product_data=prod_data,
        buyer_policy=buyer_policy,
        current_attempt=1
    )
    assert res.is_recoverable is True
    assert res.action == "RETRY_PAYMENT"

def test_failure_recovery_expired_deal_renewal():
    deal_data = {
        "final_price": 2299.0,
        "status": "EXPIRED",
        "expires_at": datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    }
    prod_data = {"inventory": 5}
    buyer_policy = {"auto_negotiation_cap": 2700.0, "absolute_max": 3000.0}

    res = RecoveryAgent.handle_payment_failure(
        deal_data=deal_data,
        product_data=prod_data,
        buyer_policy=buyer_policy,
        current_attempt=1
    )
    assert res.is_recoverable is True
    assert res.action == "RENEW_LOCK"

def test_failure_recovery_bounded_max_retries():
    deal_data = {
        "final_price": 2299.0,
        "status": "FAILED"
    }
    prod_data = {"inventory": 5}
    buyer_policy = {"auto_negotiation_cap": 2700.0}

    res = RecoveryAgent.handle_payment_failure(
        deal_data=deal_data,
        product_data=prod_data,
        buyer_policy=buyer_policy,
        current_attempt=3  # Beyond MAX_RETRIES (2)
    )
    assert res.is_recoverable is False
    assert res.action == "TERMINATE"
