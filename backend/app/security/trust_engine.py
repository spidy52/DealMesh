import datetime
from typing import Dict, Any, List, Tuple
from pydantic import BaseModel

class TrustEvaluationResult(BaseModel):
    trust_score: float  # 0 to 100
    rating_category: str  # EXCELLENT, HIGH, MODERATE, LOW
    reasons: List[str]
    freshness_status: str  # VERIFIED, STALE, UNKNOWN

class TrustEngine:
    """
    Deterministic Trust Engine calculating transparent 0-100 reliability scores.
    """

    @staticmethod
    def calculate_trust(
        merchant_name: str,
        rating: float,
        review_count: int,
        seller_name: str,
        delivery_days: int,
        return_days: int,
        is_ai_native: bool,
        last_verified_at: datetime.datetime = None,
        base_reputation: float = 90.0
    ) -> TrustEvaluationResult:
        score = 50.0  # base
        reasons = []

        # 1. Rating contribution (up to +20)
        if rating >= 4.7:
            score += 20
            reasons.append(f"Outstanding customer rating ({rating}/5.0)")
        elif rating >= 4.3:
            score += 15
            reasons.append(f"Strong customer rating ({rating}/5.0)")
        elif rating >= 4.0:
            score += 10
            reasons.append(f"Good customer rating ({rating}/5.0)")
        else:
            score -= 5
            reasons.append(f"Below average customer rating ({rating}/5.0)")

        # 2. Review volume contribution (up to +15)
        if review_count >= 2000:
            score += 15
            reasons.append(f"High review volume ({review_count:,}+ verified reviews)")
        elif review_count >= 1000:
            score += 12
            reasons.append(f"Solid review volume ({review_count:,} reviews)")
        elif review_count >= 300:
            score += 8
            reasons.append(f"Moderate review history ({review_count} reviews)")
        else:
            score += 3
            reasons.append(f"Limited review history ({review_count} reviews)")

        # 3. Return policy contribution (up to +10)
        if return_days >= 30:
            score += 10
            reasons.append(f"30-day risk-free return & replacement policy")
        elif return_days >= 14:
            score += 6
            reasons.append(f"{return_days}-day return policy")
        elif return_days >= 7:
            score += 3
            reasons.append(f"{return_days}-day standard return window")
        else:
            score -= 5
            reasons.append("Restricted or no-return policy")

        # 4. Delivery speed & reliability (up to +10)
        if delivery_days <= 2:
            score += 10
            reasons.append(f"Fast {delivery_days}-day express delivery available")
        elif delivery_days <= 4:
            score += 5
            reasons.append(f"Standard {delivery_days}-day transit time")
        else:
            reasons.append(f"Extended delivery window ({delivery_days} days)")

        # 5. DMCP AI Protocol & Official Store Verification (up to +10)
        if is_ai_native:
            score += 10
            reasons.append("Verified AI-native merchant with native DMCP protocol integration")
        elif "Official" in seller_name or "Verified" in seller_name or "Direct" in seller_name:
            score += 5
            reasons.append("Verified brand retail partner")

        # Cap score between 0 and 100
        final_score = max(0.0, min(100.0, score))

        # Rating Category
        if final_score >= 90:
            category = "EXCELLENT"
        elif final_score >= 80:
            category = "HIGH"
        elif final_score >= 70:
            category = "MODERATE"
        else:
            category = "LOW"

        # Data Freshness
        now = datetime.datetime.utcnow()
        if last_verified_at and (now - last_verified_at).total_seconds() < 86400:
            freshness = "VERIFIED"
        elif last_verified_at and (now - last_verified_at).total_seconds() < 604800:
            freshness = "STALE"
        else:
            freshness = "VERIFIED"

        return TrustEvaluationResult(
            trust_score=round(final_score, 1),
            rating_category=category,
            reasons=reasons,
            freshness_status=freshness
        )
