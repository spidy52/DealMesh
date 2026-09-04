import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.app.security.policy_engine import PolicyEngine, PolicyEvaluationResult
from backend.app.security.authorization import create_authorization_token

class BuyerIntent(BaseModel):
    raw_prompt: str
    target_category: str
    target_product_type: str
    min_budget: float
    max_budget: float
    desired_features: List[str]
    sort_strategy: str

class BuyerActionProposal(BaseModel):
    action: str  # search, make_offer, counter_offer, accept_offer, ask_user_approval, reject
    product_id: Optional[str] = None
    merchant_id: Optional[str] = None
    offer_price: Optional[float] = None
    reason: str
    policy_evaluation: Optional[PolicyEvaluationResult] = None
    authorization_data: Optional[Dict[str, Any]] = None

class BuyerAgent:
    """
    Dedicated AI Buyer Agent representing the user.
    Translates user intents into search strategies, participates in DMCP negotiations,
    and operates strictly within delegated financial authority.
    """

    def __init__(
        self,
        pet_name: str = "Omni",
        species: str = "Fox",
        personality: str = "Playful",
        target_price: float = 2000.0,
        auto_negotiation_cap: float = 2700.0,
        absolute_max: float = 3000.0
    ):
        self.pet_name = pet_name
        self.species = species
        self.personality = personality
        self.target_price = target_price
        self.auto_negotiation_cap = auto_negotiation_cap
        self.absolute_max = absolute_max

    def interpret_user_intent(self, text: str) -> BuyerIntent:
        """
        Extracts product intent, budget boundaries, and preferences from natural language.
        """
        text_lower = text.lower()

        # Extract budget amounts (e.g. "between ₹1,000 and ₹3,000", "under 2500", "budget 2000")
        min_b = 1000.0
        max_b = 3000.0

        # Pattern: between X and Y or from X to Y
        range_match = re.search(r'(?:between|from)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:and|to)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)', text_lower)
        if range_match:
            try:
                min_b = float(range_match.group(1).replace(',', ''))
                max_b = float(range_match.group(2).replace(',', ''))
            except Exception:
                pass
        else:
            # Pattern: under / below / max X
            max_match = re.search(r'(?:under|below|max|within|up to)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)', text_lower)
            if max_match:
                try:
                    max_b = float(max_match.group(1).replace(',', ''))
                except Exception:
                    pass

        # Strategy detection
        strategy = "BEST_VALUE"
        if "cheapest" in text_lower or "lowest price" in text_lower:
            strategy = "CHEAPEST"
        elif "trusted" in text_lower or "reliable" in text_lower or "best quality" in text_lower:
            strategy = "MOST_TRUSTED"
        elif "fast" in text_lower or "quick delivery" in text_lower:
            strategy = "FASTEST"

        category = "Watches"
        features = []
        if "formal" in text_lower or "dress" in text_lower:
            features.append("formal")
        if "leather" in text_lower:
            features.append("leather")
        if "black" in text_lower:
            features.append("black")
        if "silver" in text_lower or "steel" in text_lower:
            features.append("steel")

        return BuyerIntent(
            raw_prompt=text,
            target_category=category,
            target_product_type="Formal Watch" if "formal" in text_lower else "Watch",
            min_budget=min_b,
            max_budget=max_b,
            desired_features=features,
            sort_strategy=strategy
        )

    def generate_initial_offer(
        self,
        product: Dict[str, Any]
    ) -> BuyerActionProposal:
        """
        Creates an initial aggressive yet reasonable DMCP offer.
        """
        listed_price = float(product.get("listed_price", 2799.0))
        # Initial offer: target ~80-85% of listed price, but capped by target_price
        calculated_offer = max(self.target_price, round(listed_price * 0.82, 0))
        calculated_offer = min(calculated_offer, self.auto_negotiation_cap)

        policy_eval = PolicyEngine.evaluate_buyer_action(
            proposed_price=calculated_offer,
            target_price=self.target_price,
            auto_negotiation_cap=self.auto_negotiation_cap,
            absolute_max=self.absolute_max
        )

        auth_token = create_authorization_token(
            agent_id=f"buyer_pet_{self.pet_name.lower()}",
            action="initial_offer",
            price=calculated_offer
        )

        return BuyerActionProposal(
            action="make_offer",
            product_id=product.get("id"),
            merchant_id=product.get("merchant_id"),
            offer_price=calculated_offer,
            reason=f"Submitting initial offer of ₹{calculated_offer:,.0f} within target budget",
            policy_evaluation=policy_eval,
            authorization_data=auth_token
        )

    def evaluate_merchant_counter(
        self,
        product: Dict[str, Any],
        merchant_counter: float,
        current_round: int = 1,
        max_rounds: int = 4
    ) -> BuyerActionProposal:
        """
        Decides whether to accept, counter, or escalate to user approval.
        """
        merchant_counter = round(merchant_counter, 2)
        policy_eval = PolicyEngine.evaluate_buyer_action(
            proposed_price=merchant_counter,
            target_price=self.target_price,
            auto_negotiation_cap=self.auto_negotiation_cap,
            absolute_max=self.absolute_max
        )

        # 1. If counter exceeds absolute max -> Reject
        if policy_eval.decision == "BLOCK":
            return BuyerActionProposal(
                action="reject",
                product_id=product.get("id"),
                merchant_id=product.get("merchant_id"),
                offer_price=merchant_counter,
                reason=f"Merchant counter of ₹{merchant_counter:,.0f} exceeds absolute budget ceiling ₹{self.absolute_max:,.0f}",
                policy_evaluation=policy_eval
            )

        # 2. If counter exceeds auto negotiation cap -> Ask user for explicit approval!
        if policy_eval.decision == "REVIEW" or merchant_counter > self.auto_negotiation_cap:
            return BuyerActionProposal(
                action="ask_user_approval",
                product_id=product.get("id"),
                merchant_id=product.get("merchant_id"),
                offer_price=merchant_counter,
                reason=f"Merchant offered ₹{merchant_counter:,.0f}, which is above your automatic negotiation limit (₹{self.auto_negotiation_cap:,.0f}). Approval required.",
                policy_evaluation=policy_eval
            )

        # 3. If within auto negotiation cap:
        # If counter is close to target or round limit reached -> Accept!
        if merchant_counter <= self.target_price or current_round >= max_rounds:
            auth_token = create_authorization_token(
                agent_id=f"buyer_pet_{self.pet_name.lower()}",
                action="accept_offer",
                price=merchant_counter
            )
            return BuyerActionProposal(
                action="accept_offer",
                product_id=product.get("id"),
                merchant_id=product.get("merchant_id"),
                offer_price=merchant_counter,
                reason=f"Accepting merchant counter of ₹{merchant_counter:,.0f} (within delegated authority)",
                policy_evaluation=policy_eval,
                authorization_data=auth_token
            )

        # Otherwise, propose a calibrated counter-offer
        next_offer = round((self.target_price + merchant_counter) / 2.0, 0)
        next_offer = min(next_offer, self.auto_negotiation_cap)

        auth_token = create_authorization_token(
            agent_id=f"buyer_pet_{self.pet_name.lower()}",
            action="counter_offer",
            price=next_offer
        )

        return BuyerActionProposal(
            action="counter_offer",
            product_id=product.get("id"),
            merchant_id=product.get("merchant_id"),
            offer_price=next_offer,
            reason=f"Countering at ₹{next_offer:,.0f} (Round {current_round+1})",
            policy_evaluation=policy_eval,
            authorization_data=auth_token
        )
