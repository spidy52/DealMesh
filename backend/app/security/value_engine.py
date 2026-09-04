from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.app.security.trust_engine import TrustEngine, TrustEvaluationResult

class RankedProduct(BaseModel):
    product_id: str
    merchant_id: str
    merchant_name: str
    product_name: str
    brand: str
    original_price: float
    current_price: float
    currency: str
    trust_score: float
    trust_reasons: List[str]
    rating: float
    review_count: int
    delivery_days: int
    return_days: int
    inventory: int
    is_ai_native: bool
    negotiated_savings: float
    value_composite_score: float
    recommendation_badge: Optional[str] = None
    win_explanation: Optional[str] = None
    image_url: Optional[str] = None

class ValueRankingEngine:
    """
    Ranks products across multiple merchants based on strategy preferences,
    evaluating trust, verified price, negotiated savings, and seller reliability.
    """

    @staticmethod
    def rank_offers(
        offers: List[Dict[str, Any]],
        strategy: str = "BEST_VALUE"
    ) -> List[RankedProduct]:
        processed_list: List[RankedProduct] = []

        if not offers:
            return []

        # Find min and max price for reference
        prices = [float(o.get("current_price", o.get("listed_price", 1000))) for o in offers]
        min_p = min(prices) if prices else 1000.0

        for item in offers:
            listed_price = float(item.get("listed_price", item.get("price", 2500)))
            current_price = float(item.get("current_price", listed_price))
            savings = max(0.0, listed_price - current_price)
            rating = float(item.get("rating", 4.5))
            reviews = int(item.get("review_count", 500))
            delivery = int(item.get("delivery_days", 2))
            returns = int(item.get("return_days", 30))
            is_ai = bool(item.get("is_ai_native", False))
            merchant_name = str(item.get("merchant_name", item.get("seller_name", "Store")))

            # Trust calculation (0 to 100)
            trust_res = TrustEngine.calculate_trust(
                merchant_name=merchant_name,
                rating=rating,
                review_count=reviews,
                seller_name=item.get("seller_name", merchant_name),
                delivery_days=delivery,
                return_days=returns,
                is_ai_native=is_ai
            )

            # Price efficiency score relative to baseline (higher score for lower price)
            price_efficiency = max(0.0, 100.0 - (current_price / 35.0))

            # Rating score (0 to 100)
            norm_rating_score = (rating / 5.0) * 100.0

            # Delivery score (1 day = 100, 5 days = 20)
            delivery_score = max(20.0, 100.0 - (delivery - 1) * 20.0)

            # Savings bonus (up to 25 pts)
            savings_score = min(25.0, (savings / listed_price) * 100.0) if listed_price > 0 else 0.0

            # Strategy weighted score
            if strategy == "CHEAPEST":
                composite = price_efficiency * 2.0
            elif strategy == "CHEAPEST_TRUSTED":
                if trust_res.trust_score >= 80:
                    composite = (price_efficiency * 1.5) + (trust_res.trust_score * 0.5)
                else:
                    composite = (price_efficiency * 0.5)
            elif strategy == "BEST_QUALITY" or strategy == "MOST_TRUSTED":
                composite = (trust_res.trust_score * 0.6) + (norm_rating_score * 0.4)
            elif strategy == "FASTEST":
                composite = (delivery_score * 0.7) + (trust_res.trust_score * 0.3)
            elif strategy == "BEST_RETURNS":
                composite = (returns * 2.0) + (trust_res.trust_score * 0.4)
            else:  # BEST_VALUE (Default)
                # High trust (0-100) + solid price efficiency + savings bonus + rating
                composite = (
                    (trust_res.trust_score * 0.50) +
                    (price_efficiency * 0.25) +
                    (norm_rating_score * 0.10) +
                    (delivery_score * 0.05) +
                    (savings_score * 0.10)
                )

            ranked = RankedProduct(
                product_id=item.get("id", item.get("product_id", "")),
                merchant_id=item.get("merchant_id", ""),
                merchant_name=merchant_name,
                product_name=item.get("name", item.get("product_name", "")),
                brand=item.get("brand", "Generic"),
                original_price=listed_price,
                current_price=current_price,
                currency=item.get("currency", "INR"),
                trust_score=trust_res.trust_score,
                trust_reasons=trust_res.reasons,
                rating=rating,
                review_count=reviews,
                delivery_days=delivery,
                return_days=returns,
                inventory=int(item.get("inventory", 5)),
                is_ai_native=is_ai,
                negotiated_savings=round(savings, 2),
                value_composite_score=round(composite, 2),
                image_url=item.get("image_url", "")
            )
            processed_list.append(ranked)

        # Sort descending by composite score
        processed_list.sort(key=lambda x: x.value_composite_score, reverse=True)

        # Assign badges and human win explanation
        if processed_list:
            top = processed_list[0]
            top.recommendation_badge = "BEST_VALUE" if strategy == "BEST_VALUE" else strategy
            
            cheaper_alternatives = [x for x in processed_list if x.current_price < top.current_price]
            if cheaper_alternatives:
                cheapest = min(processed_list, key=lambda x: x.current_price)
                top.win_explanation = (
                    f"Selected {top.merchant_name} (₹{top.current_price:,.0f}). "
                    f"While {cheapest.merchant_name} is listed at ₹{cheapest.current_price:,.0f}, "
                    f"{top.merchant_name} offers a superior trust score ({top.trust_score}/100 vs {cheapest.trust_score}/100), "
                    f"{top.return_days}-day return protection, and verified seller authenticity."
                )
            elif top.negotiated_savings > 0:
                top.win_explanation = (
                    f"Selected {top.merchant_name} at negotiated price ₹{top.current_price:,.0f} (saved ₹{top.negotiated_savings:,.0f}). "
                    f"Combines the lowest verified price in market with a {top.trust_score}/100 trust rating."
                )
            else:
                top.win_explanation = (
                    f"Selected {top.merchant_name} at ₹{top.current_price:,.0f} with {top.trust_score}/100 trust rating and {top.rating}★ customer feedback."
                )

        return processed_list
