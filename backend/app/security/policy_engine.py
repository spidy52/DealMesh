from typing import Dict, Any, Tuple, Optional
from pydantic import BaseModel

class PolicyEvaluationResult(BaseModel):
    decision: str  # ALLOW, REVIEW, BLOCK
    authorized: bool
    requires_user_approval: bool
    reasons: list[str]
    max_authorized_price: Optional[float] = None

class PolicyEngine:
    """
    Deterministic Policy Engine for Buyer and Merchant financial limits.
    Enforces absolute boundary constraints and zero-leakage isolation.
    """

    @staticmethod
    def evaluate_buyer_action(
        proposed_price: float,
        target_price: float,
        auto_negotiation_cap: float,
        absolute_max: float,
        category: str = "watches",
        allowed_categories: str = "watches,electronics,accessories",
        merchant_name: str = "Titan Demo Store",
        allowed_merchants: str = "*"
    ) -> PolicyEvaluationResult:
        """
        Evaluates proposed buyer offer / price against private buyer policy.
        """
        reasons = []

        # 1. Category whitelist check
        allowed_cat_list = [c.strip().lower() for c in allowed_categories.split(",") if c.strip()]
        if "*" not in allowed_cat_list and category.lower() not in allowed_cat_list:
            reasons.append(f"Category '{category}' is not within authorized categories.")
            return PolicyEvaluationResult(
                decision="BLOCK",
                authorized=False,
                requires_user_approval=False,
                reasons=reasons
            )

        # 2. Merchant whitelist check
        allowed_merch_list = [m.strip().lower() for m in allowed_merchants.split(",") if m.strip()]
        if "*" not in allowed_merch_list and merchant_name.lower() not in allowed_merch_list:
            reasons.append(f"Merchant '{merchant_name}' is not within authorized merchant whitelist.")
            return PolicyEvaluationResult(
                decision="BLOCK",
                authorized=False,
                requires_user_approval=False,
                reasons=reasons
            )

        # 3. Financial threshold check
        proposed_price = round(proposed_price, 2)
        if proposed_price > absolute_max:
            reasons.append(f"Proposed price ₹{proposed_price} exceeds buyer absolute maximum ceiling of ₹{absolute_max}.")
            return PolicyEvaluationResult(
                decision="BLOCK",
                authorized=False,
                requires_user_approval=False,
                reasons=reasons
            )

        if proposed_price > auto_negotiation_cap:
            reasons.append(f"Proposed price ₹{proposed_price} exceeds automatic negotiation cap ₹{auto_negotiation_cap}, but within absolute max ₹{absolute_max}.")
            return PolicyEvaluationResult(
                decision="REVIEW",
                authorized=True,
                requires_user_approval=True,
                reasons=reasons,
                max_authorized_price=absolute_max
            )

        # Within automatic limit
        reasons.append(f"Proposed price ₹{proposed_price} is within delegated autonomous cap ₹{auto_negotiation_cap}.")
        return PolicyEvaluationResult(
            decision="ALLOW",
            authorized=True,
            requires_user_approval=False,
            reasons=reasons,
            max_authorized_price=auto_negotiation_cap
        )

    @staticmethod
    def evaluate_merchant_action(
        offered_price: float,
        listed_price: float,
        preferred_price: float,
        auto_negotiation_floor: float,
        absolute_floor: float,
        human_approval_threshold: float,
        is_paused: bool = False
    ) -> PolicyEvaluationResult:
        """
        Evaluates buyer offer against merchant private policy and floors.
        """
        reasons = []
        if is_paused:
            reasons.append("Merchant AI agent is currently paused by store manager.")
            return PolicyEvaluationResult(
                decision="BLOCK",
                authorized=False,
                requires_user_approval=True,
                reasons=reasons
            )

        offered_price = round(offered_price, 2)

        # 1. Hard Floor check
        if offered_price < absolute_floor:
            reasons.append(f"Offered price ₹{offered_price} is strictly below merchant private absolute floor.")
            return PolicyEvaluationResult(
                decision="BLOCK",
                authorized=False,
                requires_user_approval=False,
                reasons=reasons
            )

        # 2. Human approval threshold or auto floor check
        if offered_price < auto_negotiation_floor or offered_price < human_approval_threshold:
            reasons.append(f"Offered price ₹{offered_price} is above absolute floor, but below automatic floor ₹{auto_negotiation_floor} (requires merchant approval).")
            return PolicyEvaluationResult(
                decision="REVIEW",
                authorized=True,
                requires_user_approval=True,
                reasons=reasons
            )

        # 3. Within automatic floor
        reasons.append(f"Offered price ₹{offered_price} meets automatic negotiation floor ₹{auto_negotiation_floor}.")
        return PolicyEvaluationResult(
            decision="ALLOW",
            authorized=True,
            requires_user_approval=False,
            reasons=reasons
        )
