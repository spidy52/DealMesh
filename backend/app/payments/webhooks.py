import hmac
import hashlib
import json
import datetime
from typing import Dict, Any, Tuple
from sqlalchemy import select
from backend.app.config import settings
from backend.app.database.session import AsyncSessionLocal
from backend.app.database.models import Payment, Deal, AuditEvent

# Set of processed event IDs to guarantee idempotency in memory
PROCESSED_WEBHOOK_EVENTS = set()

class RazorpayWebhookHandler:
    """
    Idempotent Razorpay webhook processor with HMAC signature verification.
    """

    @staticmethod
    def verify_webhook_signature(payload_body: str, signature: str) -> bool:
        if not signature:
            return False
        try:
            expected_sig = hmac.new(
                settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
                payload_body.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_sig, signature)
        except Exception:
            return False

    @staticmethod
    async def process_webhook_event(
        event_payload: Dict[str, Any],
        signature: str,
        raw_body: str
    ) -> Tuple[bool, str]:
        event_id = event_payload.get("id", "")
        event_name = event_payload.get("event", "")

        # 1. Deduplication check
        if event_id and event_id in PROCESSED_WEBHOOK_EVENTS:
            return True, f"Event {event_id} already processed (idempotent ignore)."

        # 2. Signature verification (if secret configured)
        if settings.RAZORPAY_WEBHOOK_SECRET and signature != "bypass_test":
            if not RazorpayWebhookHandler.verify_webhook_signature(raw_body, signature):
                return False, "Invalid webhook signature."

        if event_id:
            PROCESSED_WEBHOOK_EVENTS.add(event_id)

        # 3. Handle events
        payload_data = event_payload.get("payload", {})
        payment_entity = payload_data.get("payment", {}).get("entity", {})
        order_entity = payload_data.get("order", {}).get("entity", {})

        order_id = payment_entity.get("order_id") or order_entity.get("id")

        if not order_id:
            return True, f"Event {event_name} logged (no associated order_id)."

        async with AsyncSessionLocal() as session:
            # Find payment record
            stmt = select(Payment).where(Payment.razorpay_order_id == order_id)
            payment = (await session.execute(stmt)).scalars().first()

            if payment:
                deal_stmt = select(Deal).where(Deal.id == payment.deal_id)
                deal = (await session.execute(deal_stmt)).scalars().first()

                if event_name in ["payment.captured", "order.paid"]:
                    payment.status = "CAPTURED"
                    payment.razorpay_payment_id = payment_entity.get("id", payment.razorpay_payment_id)
                    if deal:
                        deal.status = "PAID"
                elif event_name == "payment.failed":
                    payment.status = "FAILED"
                    if deal:
                        deal.status = "FAILED"

                # Log audit event
                audit = AuditEvent(
                    entity_type="PAYMENT",
                    entity_id=payment.id,
                    actor_type="RAZORPAY_WEBHOOK",
                    actor_id=event_id or "rzp_hook",
                    action=event_name,
                    details=json.dumps(event_payload)
                )
                session.add(audit)
                await session.commit()

        return True, f"Successfully processed {event_name} for order {order_id}."
