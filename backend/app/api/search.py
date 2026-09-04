import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.session import get_db
from backend.app.database.models import SearchSession
from backend.app.commerce.search_provider import SearchProvider
from backend.app.security.value_engine import ValueRankingEngine, RankedProduct
from backend.app.websocket.manager import ws_manager

router = APIRouter(prefix="/search", tags=["Multi-Store Search & Ranking"])

class SearchRequest(BaseModel):
    query: str
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    category: Optional[str] = None
    strategy: str = "BEST_VALUE"
    user_id: str = "user_buyer_default"

@router.post("/market")
async def execute_market_search(req: SearchRequest, db: AsyncSession = Depends(get_db)):
    """
    Executes real-time concurrent multi-store search across all 12 merchants
    and computes value-ranked recommendations.
    """
    # Broadcast search start to Pet and Buyer UI
    await ws_manager.broadcast_event("search.started", {
        "query": req.query,
        "min_price": req.min_price,
        "max_price": req.max_price,
        "strategy": req.strategy
    })

    eff_min = req.min_price if req.min_price is not None else 0.0
    eff_max = req.max_price if req.max_price is not None else 999999.0
    eff_cat = req.category or "General"

    # Execute concurrent multi-merchant search
    search_res = await SearchProvider.concurrent_market_search(
        query=req.query,
        min_price=eff_min,
        max_price=eff_max,
        category=eff_cat
    )

    # Save search session
    session_rec = SearchSession(
        user_id=req.user_id,
        query=req.query,
        min_price=eff_min,
        max_price=eff_max,
        category=eff_cat,
        stores_checked=search_res["stores_checked"],
        products_found=search_res["products_found"],
        ai_merchants_count=search_res["ai_merchants_count"],
        status="COMPLETED"
    )
    db.add(session_rec)
    await db.commit()

    # Apply Trust Engine and Value Ranking
    raw_products = search_res.get("products", [])
    ranked_products = ValueRankingEngine.rank_offers(raw_products, strategy=req.strategy)

    response_payload = {
        "search_session_id": session_rec.id,
        "query": req.query,
        "strategy": req.strategy,
        "stores_checked": search_res["stores_checked"],
        "products_found": search_res["products_found"],
        "ai_merchants_count": search_res["ai_merchants_count"],
        "store_reports": search_res["store_reports"],
        "ranked_products": [p.dict() for p in ranked_products]
    }

    # Broadcast completion
    await ws_manager.broadcast_event("search.completed", {
        "search_session_id": session_rec.id,
        "stores_checked": search_res["stores_checked"],
        "products_found": search_res["products_found"],
        "ai_merchants_count": search_res["ai_merchants_count"],
        "top_product": ranked_products[0].dict() if ranked_products else None
    })

    return response_payload

@router.post("/live")
async def execute_live_search(req: SearchRequest):
    """
    Executes 100% Real Live Web Search via Firecrawl & Playwright verification.
    Discovers actual URLs and extracts verified DOM prices across Amazon, Flipkart, Myntra, etc.
    """
    from backend.app.commerce.live_web_search_provider import LiveWebSearchProvider

    # Broadcast live search started
    await ws_manager.broadcast_event("search.started", {
        "query": req.query,
        "mode": "LIVE_WEB",
        "min_price": req.min_price,
        "max_price": req.max_price
    })

    min_b = int(req.min_price) if req.min_price is not None else None
    max_b = int(req.max_price) if req.max_price is not None else None
    result = await LiveWebSearchProvider.execute_live_multi_store_search(
        query=req.query,
        min_budget=min_b,
        max_budget=max_b
    )

    # Broadcast live search completed
    await ws_manager.broadcast_event("search.completed", {
        "query": req.query,
        "mode": "LIVE_WEB",
        "success": result.get("success", False),
        "stores_checked": len(result.get("stores", [])),
        "products_found": len(result.get("products", [])),
        "top_product": result.get("products", [{}])[0] if result.get("products") else None
    })

    return result

@router.get("/strategies")
async def get_ranking_strategies():
    return {
        "strategies": [
            {"key": "BEST_VALUE", "label": "Best Value (Trust + Savings)", "description": "Balances lowest verified price with seller trust, return protection, and delivery speed."},
            {"key": "CHEAPEST_TRUSTED", "label": "Cheapest Trusted (80+ Trust)", "description": "Lowest priced option among verified reputable merchants."},
            {"key": "CHEAPEST", "label": "Lowest Price", "description": "Strictly lowest price regardless of trust or return terms."},
            {"key": "MOST_TRUSTED", "label": "Highest Trust & Quality", "description": "Highest rated official brand stores and premium warranties."},
            {"key": "FASTEST", "label": "Fastest Delivery", "description": "Stores offering same-day or 1-2 day express shipping."},
            {"key": "BEST_RETURNS", "label": "Best Return Policy", "description": "30-day risk-free full replacement and return coverage."}
        ]
    }
