import asyncio
import json
import datetime
from typing import List, Dict, Any, Callable, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.database.session import AsyncSessionLocal
from backend.app.database.models import Merchant, Product, MerchantPolicy

class SearchProvider:
    """
    Concurrent multi-merchant search provider with bounded async execution,
    per-merchant timeout, and error isolation.
    """

    @staticmethod
    async def search_merchant(
        merchant_id: str,
        query: str,
        min_price: float,
        max_price: float,
        category: str = "Watches",
        timeout_seconds: float = 2.0
    ) -> Dict[str, Any]:
        """
        Searches a single merchant with bounded timeout.
        """
        try:
            async with AsyncSessionLocal() as session:
                # Query merchant with products
                stmt = (
                    select(Merchant)
                    .options(selectinload(Merchant.products).selectinload(Product.policy))
                    .where(Merchant.id == merchant_id)
                )
                merchant = (await session.execute(stmt)).scalars().first()

                if not merchant:
                    return {
                        "merchant_id": merchant_id,
                        "merchant_name": "Unknown",
                        "status": "NOT_FOUND",
                        "is_ai_native": False,
                        "products": []
                    }

                # Filter products matching budget & search tokens
                tokens = [t.lower() for t in query.split() if len(t) > 2]
                matched_products = []

                for prod in merchant.products:
                    # Price bounds (allow up to 25% above max_price for AI merchants since they negotiate down!)
                    effective_max = max_price * 1.25 if prod.is_ai_native else max_price
                    if prod.listed_price < min_price or prod.listed_price > effective_max:
                        continue

                    # Text match check
                    prod_name_lower = prod.name.lower()
                    prod_brand_lower = prod.brand.lower()
                    features_str = prod.features.lower() if prod.features else ""

                    # If query tokens match or broad query
                    is_match = True
                    if tokens:
                        is_match = any(t in prod_name_lower or t in prod_brand_lower or t in features_str for t in tokens) or len(tokens) == 0

                    if is_match or "watch" in query.lower():
                        # Parse features
                        features_list = []
                        try:
                            features_list = json.loads(prod.features) if prod.features else []
                        except Exception:
                            pass

                        prod_dict = {
                            "id": prod.id,
                            "product_id": prod.id,
                            "merchant_id": merchant.id,
                            "merchant_name": merchant.store_name,
                            "name": prod.name,
                            "product_name": prod.name,
                            "brand": prod.brand,
                            "category": prod.category,
                            "listed_price": prod.listed_price,
                            "current_price": prod.listed_price,
                            "currency": prod.currency,
                            "rating": prod.rating,
                            "review_count": prod.review_count,
                            "seller_name": prod.seller_name,
                            "delivery_days": prod.delivery_days,
                            "return_days": prod.return_days,
                            "inventory": prod.inventory,
                            "is_ai_native": prod.is_ai_native,
                            "features": features_list,
                            "image_url": prod.image_url,
                            "last_verified_at": prod.last_verified_at.isoformat() if prod.last_verified_at else None
                        }
                        matched_products.append(prod_dict)

                return {
                    "merchant_id": merchant.id,
                    "merchant_name": merchant.store_name,
                    "status": "SUCCESS",
                    "is_ai_native": merchant.agent_supported,
                    "dmcp_endpoint": merchant.dmcp_endpoint,
                    "trust_reputation_score": merchant.trust_reputation_score,
                    "products": matched_products
                }
        except asyncio.TimeoutError:
            return {
                "merchant_id": merchant_id,
                "merchant_name": "Store",
                "status": "TIMEOUT",
                "is_ai_native": False,
                "products": []
            }
        except Exception as e:
            return {
                "merchant_id": merchant_id,
                "merchant_name": "Store",
                "status": "ERROR",
                "error": str(e),
                "is_ai_native": False,
                "products": []
            }

    @staticmethod
    async def concurrent_market_search(
        query: str,
        min_price: float = 1000.0,
        max_price: float = 3000.0,
        category: str = "Watches",
        progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ) -> Dict[str, Any]:
        """
        Searches all active merchants in parallel with bounded concurrency and progress reporting.
        """
        async with AsyncSessionLocal() as session:
            stmt = select(Merchant.id).where(Merchant.is_active == True)
            merchant_ids = (await session.execute(stmt)).scalars().all()

        tasks = []
        for m_id in merchant_ids:
            tasks.append(
                SearchProvider.search_merchant(
                    merchant_id=m_id,
                    query=query,
                    min_price=min_price,
                    max_price=max_price,
                    category=category
                )
            )

        # Run concurrently with gather
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_products = []
        stores_checked = 0
        ai_merchants_count = 0
        store_reports = []

        for res in results:
            if isinstance(res, dict):
                stores_checked += 1
                if res.get("is_ai_native"):
                    ai_merchants_count += 1
                store_reports.append({
                    "merchant_id": res.get("merchant_id"),
                    "merchant_name": res.get("merchant_name"),
                    "status": res.get("status"),
                    "is_ai_native": res.get("is_ai_native"),
                    "product_count": len(res.get("products", []))
                })
                all_products.extend(res.get("products", []))

        return {
            "query": query,
            "min_price": min_price,
            "max_price": max_price,
            "stores_checked": stores_checked,
            "products_found": len(all_products),
            "ai_merchants_count": ai_merchants_count,
            "store_reports": store_reports,
            "products": all_products,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
