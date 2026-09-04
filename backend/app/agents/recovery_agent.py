import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel
from backend.app.security.policy_engine import PolicyEngine

class RecoveryResult(BaseModel):
    action: str  # RETRY_PAYMENT, RENEW_LOCK, RENEGOTIATE, ASK_USER, TERMINATE
    new_price: Optional[float] = None
    attempt_number: int
    message: str
    is_recoverable: bool

class RecoveryAgent:
    """
    Autonomous Recovery Agent for bounded 2-step deal & payment failure resolution.
    """

    MAX_RETRIES = 2

    @staticmethod
    def handle_payment_failure(
        deal_data: Dict[str, Any],
        product_data: Dict[str, Any],
        buyer_policy: Dict[str, Any],
        current_attempt: int = 1
    ) -> RecoveryResult:
        """
        Executes bounded failure recovery sequence when payment or deal lock fails.
        """
        if current_attempt > RecoveryAgent.MAX_RETRIES:
            return RecoveryResult(
                action="TERMINATE",
                new_price=None,
                attempt_number=current_attempt,
                message=f"Maximum recovery attempts ({RecoveryAgent.MAX_RETRIES}) reached. Deal released safely.",
                is_recoverable=False
            )

        deal_price = float(deal_data.get("final_price", 0))
        inventory = int(product_data.get("inventory", 0))
        is_expired = deal_data.get("status") == "EXPIRED" or (
            deal_data.get("expires_at") and datetime.datetime.utcnow() > deal_data.get("expires_at")
        )

        # 1. Inventory Check
        if inventory <= 0:
            return RecoveryResult(
                action="TERMINATE",
                new_price=None,
                attempt_number=current_attempt,
                message="Product stock was depleted before settlement. Recommending alternative stores.",
                is_recoverable=False
            )

        # 2. Offer Expired Check
        if is_expired:
            # If still within buyer auto cap, request renewal
            auto_cap = float(buyer_policy.get("auto_negotiation_cap", 2700))
            if deal_price <= auto_cap:
                return RecoveryResult(
                    action="RENEW_LOCK",
                    new_price=deal_price,
                    attempt_number=current_attempt,
                    message=f"Deal lock expired. Requesting automatic lock renewal at original agreed price ₹{deal_price:,.0f}.",
                    is_recoverable=True
                )
            else:
                return RecoveryResult(
                    action="ASK_USER",
                    new_price=deal_price,
                    attempt_number=current_attempt,
                    message=f"Deal expired and new settlement price is ₹{deal_price:,.0f}. User confirmation required.",
                    is_recoverable=True
                )

        # 3. If price and inventory valid, execute single retry
        return RecoveryResult(
            action="RETRY_PAYMENT",
            new_price=deal_price,
            attempt_number=current_attempt,
            message=f"Network glitch diagnosed. Retrying payment attempt {current_attempt}/{RecoveryAgent.MAX_RETRIES} with valid deal lock.",
            is_recoverable=True
        )
