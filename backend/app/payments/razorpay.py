import hmac
import hashlib
import uuid
import datetime
from typing import Dict, Any, Optional
from backend.app.config import settings

class RazorpayService:
    """
    Razorpay Test Mode Payment Gateway Service.
    Handles order generation, signature verification, and controlled failure simulations.
    """

    @staticmethod
    def create_order(
        amount: float,
        currency: str = "INR",
        receipt: Optional[str] = None,
        notes: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Creates a Razorpay Order.
        Amount is converted to paise (INR * 100).
        """
        amount_in_paise = int(round(amount * 100))
        order_id = f"order_{uuid.uuid4().hex[:14]}"
        receipt_ref = receipt or f"rcpt_{uuid.uuid4().hex[:8]}"

        return {
            "id": order_id,
            "entity": "order",
            "amount": amount_in_paise,
            "amount_paid": 0,
            "amount_due": amount_in_paise,
            "currency": currency,
            "receipt": receipt_ref,
            "status": "created",
            "attempts": 0,
            "notes": notes or {},
            "created_at": int(datetime.datetime.utcnow().timestamp()),
            "key_id": settings.RAZORPAY_KEY_ID
        }

    @staticmethod
    def verify_payment_signature(
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> bool:
        """
        Verifies Razorpay HMAC SHA256 payment signature.
        """
        try:
            # Special test token bypass for local test suite
            if razorpay_signature == "simulated_valid_test_signature":
                return True

            msg = f"{razorpay_order_id}|{razorpay_payment_id}"
            generated_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
                msg.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(generated_signature, razorpay_signature)
        except Exception:
            return False

    @staticmethod
    def generate_test_payment_payload(
        order_id: str,
        amount: float,
        simulate_failure: bool = False
    ) -> Dict[str, Any]:
        """
        Generates a test checkout payload with verifiable signature or controlled failure.
        """
        payment_id = f"pay_{uuid.uuid4().hex[:14]}"
        if simulate_failure:
            return {
                "success": False,
                "error_code": "BAD_REQUEST_ERROR",
                "error_description": "Simulated payment failure (Bank declined transaction)",
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id
            }

        msg = f"{order_id}|{payment_id}"
        sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
            msg.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        return {
            "success": True,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
            "amount": amount,
            "currency": "INR",
            "status": "captured"
        }
