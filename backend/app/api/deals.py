import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.session import get_db
from backend.app.database.models import Deal, Product, Merchant
from backend.app.security.policy_engine import PolicyEngine
from backend.app.security.risk_engine import RiskEngine

router = APIRouter(prefix="/deals", tags=["Deals"])

@router.get("/{deal_id}")
async def get_deal_details(deal_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Deal)
        .options(selectinload(Deal.product), selectinload(Deal.merchant))
        .where((Deal.id == deal_id) | (Deal.deal_ref == deal_id))
    )
    deal = (await db.execute(stmt)).scalars().first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    is_expired = datetime.datetime.utcnow() > deal.expires_at

    return {
        "id": deal.id,
        "deal_ref": deal.deal_ref,
        "product_id": deal.product_id,
        "product_name": deal.product.name if deal.product else "Formal Watch",
        "merchant_id": deal.merchant_id,
        "merchant_name": deal.merchant.store_name if deal.merchant else "Titan Store",
        "listed_price": deal.listed_price,
        "final_price": deal.final_price,
        "currency": deal.currency,
        "savings": round(deal.listed_price - deal.final_price, 2),
        "inventory_reserved": deal.inventory_reserved,
        "status": "EXPIRED" if (is_expired and deal.status == "LOCKED") else deal.status,
        "expires_at": deal.expires_at.isoformat(),
        "created_at": deal.created_at.isoformat()
    }
