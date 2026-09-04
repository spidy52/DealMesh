import pytest
from backend.app.security.trust_engine import TrustEngine
from backend.app.security.value_engine import ValueRankingEngine

def test_trust_engine_scoring():
    res = TrustEngine.calculate_trust(
        merchant_name="Titan Demo Store",
        rating=4.8,
        review_count=3100,
        seller_name="Titan Official Retail",
        delivery_days=2,
        return_days=30,
        is_ai_native=True
    )
    assert res.trust_score >= 90.0
    assert res.rating_category == "EXCELLENT"
    assert len(res.reasons) >= 4

def test_value_ranking_strategy_best_value():
    offers = [
        {
            "id": "watch_cheap_untrusted",
            "name": "Generic Watch",
            "listed_price": 2050.0,
            "current_price": 2050.0,
            "rating": 3.8,
            "review_count": 50,
            "seller_name": "Unknown Seller",
            "delivery_days": 5,
            "return_days": 5,
            "is_ai_native": False
        },
        {
            "id": "watch_titan_best",
            "name": "Titan Neo Workwear",
            "listed_price": 2799.0,
            "current_price": 2299.0,
            "rating": 4.8,
            "review_count": 3100,
            "seller_name": "Titan Official Retail",
            "delivery_days": 2,
            "return_days": 30,
            "is_ai_native": True
        }
    ]

    ranked = ValueRankingEngine.rank_offers(offers, strategy="BEST_VALUE")
    assert len(ranked) == 2
    # Titan should win BEST_VALUE due to high trust (94+), 30-day return, and negotiated savings!
    assert ranked[0].product_id == "watch_titan_best"
    assert ranked[0].recommendation_badge == "BEST_VALUE"
    assert ranked[0].win_explanation is not None
