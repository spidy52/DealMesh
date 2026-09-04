import pytest
import datetime
from backend.app.security.risk_engine import RiskEngine
from backend.app.payments.razorpay import RazorpayService

def test_risk_engine_valid_transaction():
    future_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    res = RiskEngine.evaluate_deal_lock(
        deal_final_price=2299.0,
        payment_amount=2299.0,
        deal_expires_at=future_expiry,
        inventory_reserved=True,
        is_duplicate=False
    )
    assert res.decision == "ALLOW"
    assert res.is_safe_to_execute is True
    assert res.risk_score < 0.1

def test_risk_engine_blocks_price_tampering():
    future_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    res = RiskEngine.evaluate_deal_lock(
        deal_final_price=2299.0,
        payment_amount=1999.0,  # Price tampering!
        deal_expires_at=future_expiry,
        inventory_reserved=True
    )
    assert res.decision == "BLOCK"
    assert res.is_safe_to_execute is False

def test_risk_engine_blocks_expired_deal():
    past_expiry = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    res = RiskEngine.evaluate_deal_lock(
        deal_final_price=2299.0,
        payment_amount=2299.0,
        deal_expires_at=past_expiry,
        inventory_reserved=True
    )
    assert res.decision == "BLOCK"
    assert res.is_safe_to_execute is False

def test_razorpay_signature_verification():
    payload = RazorpayService.generate_test_payment_payload(
        order_id="order_test_9988",
        amount=2299.0,
        simulate_failure=False
    )
    assert payload["success"] is True
    is_valid = RazorpayService.verify_payment_signature(
        razorpay_order_id=payload["razorpay_order_id"],
        razorpay_payment_id=payload["razorpay_payment_id"],
        razorpay_signature=payload["razorpay_signature"]
    )
    assert is_valid is True
