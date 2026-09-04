from typing import Dict, Any, Optional
from pydantic import BaseModel
from backend.app.security.policy_engine import PolicyEngine, PolicyEvaluationResult
from backend.app.security.authorization import create_authorization_token

class MerchantActionProposal(BaseModel):
    action: str  # accept_offer, counter_offer, waiting_for_approval, reject_below_floor, scarcity_hold, pause_alert
    counter_price: Optional[float] = None
    reason: str
    inventory_available: bool = True
    scarcity_active: bool = False
    policy_evaluation: Optional[PolicyEvaluationResult] = None
    authorization_data: Optional[Dict[str, Any]] = None

class MerchantAgent:
    """
    Dedicated AI Merchant Agent representing the store seller.
    Manages automated DMCP negotiations, inventory reservation, and concession curves
    while strictly protecting merchant-private reservation floors.
    """

    def __init__(
        self,
        agent_name: str = "TitanBot",
        personality: str = "Polite Luxury Concierge",
        is_paused: bool = False,
        negotiation_enabled: bool = True,
        max_auto_discount_percent: float = 20.0,
        scarcity_threshold: int = 1
    ):
        self.agent_name = agent_name
        self.personality = personality
        self.is_paused = is_paused
        self.negotiation_enabled = negotiation_enabled
        self.max_auto_discount_percent = max_auto_discount_percent
        self.scarcity_threshold = scarcity_threshold

    def evaluate_buyer_offer(
        self,
        product: Dict[str, Any],
        buyer_offer: float,
        current_round: int = 1,
        max_rounds: int = 4
    ) -> MerchantActionProposal:
        """
        Processes an incoming buyer offer against private merchant policy.
        """
        buyer_offer = round(buyer_offer, 2)
        listed_price = float(product.get("listed_price", 2799.0))
        inventory = int(product.get("inventory", 10))

        # Private policy fields (strictly server-side)
        policy_data = product.get("policy", {})
        preferred_price = float(policy_data.get("preferred_price", listed_price * 0.90))
        auto_floor = float(policy_data.get("auto_negotiation_floor", listed_price * 0.85))
        absolute_floor = float(policy_data.get("absolute_floor", listed_price * 0.80))
        approval_threshold = float(policy_data.get("human_approval_threshold", auto_floor))

        is_scarcity = inventory <= self.scarcity_threshold

        # 1. Check if agent is paused or negotiation disabled
        if self.is_paused or not self.negotiation_enabled:
            return MerchantActionProposal(
                action="counter_offer",
                counter_price=listed_price,
                reason="Negotiation is currently paused by store manager. Fixed listed price applies.",
                inventory_available=inventory > 0,
                scarcity_active=is_scarcity
            )

        # 2. Check stock
        if inventory <= 0:
            return MerchantActionProposal(
                action="reject_below_floor",
                counter_price=None,
                reason="Item is currently out of stock.",
                inventory_available=False,
                scarcity_active=False
            )

        # 3. Policy evaluation
        policy_eval = PolicyEngine.evaluate_merchant_action(
            offered_price=buyer_offer,
            listed_price=listed_price,
            preferred_price=preferred_price,
            auto_negotiation_floor=auto_floor,
            absolute_floor=absolute_floor,
            human_approval_threshold=approval_threshold,
            is_paused=self.is_paused
        )

        # 4. Case A: If offer >= preferred price or (offer >= auto_floor and current_round >= 2) -> ACCEPT!
        if buyer_offer >= preferred_price or (buyer_offer >= auto_floor and current_round >= 2):
            auth_token = create_authorization_token(
                agent_id=f"merchant_agent_{self.agent_name.lower()}",
                action="accept_offer",
                price=buyer_offer
            )
            return MerchantActionProposal(
                action="accept_offer",
                counter_price=buyer_offer,
                reason=f"Offer of ₹{buyer_offer:,.0f} accepted within merchant delegated authority.",
                inventory_available=True,
                scarcity_active=is_scarcity,
                policy_evaluation=policy_eval,
                authorization_data=auth_token
            )

        # 5. Case B: Offer is within human approval range (below auto_floor, but >= absolute_floor)
        if absolute_floor <= buyer_offer < auto_floor and current_round >= 2:
            return MerchantActionProposal(
                action="waiting_for_approval",
                counter_price=buyer_offer,
                reason=f"Offer of ₹{buyer_offer:,.0f} is within store review parameters. Escalated for human approval.",
                inventory_available=True,
                scarcity_active=is_scarcity,
                policy_evaluation=policy_eval
            )

        # 6. Case C: Offer strictly below absolute floor on late round -> REJECT
        if buyer_offer < absolute_floor and current_round >= max_rounds:
            return MerchantActionProposal(
                action="reject_below_floor",
                counter_price=None,
                reason="Offer rejected as it does not meet merchant pricing parameters.",
                inventory_available=True,
                scarcity_active=is_scarcity,
                policy_evaluation=policy_eval
            )

        # 7. Otherwise: Make bounded strategic counter towards auto_floor
        progress = min(1.0, current_round / float(max_rounds))
        
        if is_scarcity:
            # During scarcity, hold tighter margin
            calculated_counter = round(listed_price - (listed_price - preferred_price) * 0.4, 0)
        else:
            # Step down from listed_price towards auto_floor
            calculated_counter = round(listed_price - (listed_price - auto_floor) * progress, 0)

        # Ensure counter does not fall below auto_floor
        calculated_counter = max(auto_floor, calculated_counter)

        auth_token = create_authorization_token(
            agent_id=f"merchant_agent_{self.agent_name.lower()}",
            action="counter_offer",
            price=calculated_counter
        )

        return MerchantActionProposal(
            action="counter_offer",
            counter_price=calculated_counter,
            reason=f"Counter-offer of ₹{calculated_counter:,.0f} generated (Round {current_round}).",
            inventory_available=True,
            scarcity_active=is_scarcity,
            policy_evaluation=policy_eval,
            authorization_data=auth_token
        )
