from typing import List, Dict, Any
from backend.app.security.value_engine import ValueRankingEngine, RankedProduct

class RankingAgent:
    """
    Synthesizes search results, AI negotiations, and fixed-price offers
    into ranked, trust-aware deal recommendations.
    """

    @staticmethod
    def rank_market_offers(
        offers: List[Dict[str, Any]],
        strategy: str = "BEST_VALUE"
    ) -> List[RankedProduct]:
        return ValueRankingEngine.rank_offers(offers, strategy=strategy)
