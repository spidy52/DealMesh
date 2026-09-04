import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.app.security.authorization import verify_authorization_token

class RiskEvaluationResult(BaseModel):
    decision: str  # ALLOW, REVIEW, BLOCK
    risk_score: float  # 0.0 - 1.0 (lower is safer)
    reasons: List[str]
    is_safe_to_execute: bool

class RiskEngine:
    """
    Evaluates transaction risk, tampering attempts, deal expiry, and duplicate transactions.
    """

    @staticmethod
    def evaluate_deal_lock(
        deal_final_price: float,
        payment_amount: float,
        deal_expires_at: datetime.datetime,
        inventory_reserved: bool,
        buyer_auth: Optional[Dict[str, Any]] = None,
        is_duplicate: bool = False
    ) -> RiskEvaluationResult:
        reasons = []
        risk_score = 0.02  # baseline safe score

        # 1. Duplicate check
        if is_duplicate:
            reasons.append("Duplicate payment or order initiation detected for this deal reference.")
            return RiskEvaluationResult(
                decision="BLOCK",
                risk_score=0.99,
                reasons=reasons,
                is_safe_to_execute=False
            )

        # 2. Expiry check
        now = datetime.datetime.utcnow()
        if deal_expires_at and now > deal_expires_at:
            reasons.append(f"Deal lock has expired at {deal_expires_at.isoformat()} (current time {now.isoformat()}).")
            risk_score += 0.85
            return RiskEvaluationResult(
                decision="BLOCK",
                risk_score=risk_score,
                reasons=reasons,
                is_safe_to_execute=False
            )

        # 3. Price mismatch check (tampering guard)
        if abs(deal_final_price - payment_amount) > 0.01:
            reasons.append(f"Price mismatch detected! Deal locked at ₹{deal_final_price}, but payment amount is ₹{payment_amount}.")
            risk_score += 0.95
            return RiskEvaluationResult(
                decision="BLOCK",
                risk_score=risk_score,
                reasons=reasons,
                is_safe_to_execute=False
            )

        # 4. Inventory reservation check
        if not inventory_reserved:
            reasons.append("Inventory reservation was not held or released.")
            risk_score += 0.50
            return RiskEvaluationResult(
                decision="REVIEW",
                risk_score=risk_score,
                reasons=reasons,
                is_safe_to_execute=False
            )

        # 5. Buyer authorization validation if provided
        if buyer_auth:
            is_valid = verify_authorization_token(buyer_auth)
            if not is_valid:
                reasons.append("Buyer authorization token signature verification failed.")
                risk_score += 0.90
                return RiskEvaluationResult(
                    decision="BLOCK",
                    risk_score=risk_score,
                    reasons=reasons,
                    is_safe_to_execute=False
                )

        reasons.append("All risk firewall checks passed. Transaction is authorized and safe.")
        return RiskEvaluationResult(
            decision="ALLOW",
            risk_score=round(risk_score, 2),
            reasons=reasons,
            is_safe_to_execute=True
        )
