import datetime
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.session import get_db
from backend.app.database.models import Merchant, MerchantAgent, Product, MerchantPolicy, Deal, AuditEvent, InventoryReservation
from backend.app.commerce.discovery import MerchantDiscovery
from backend.app.security.authorization import verify_authorization_token, create_authorization_token
from backend.app.agents.merchant_agent import MerchantAgent as MerchantAgentLogic
from backend.app.websocket.manager import ws_manager

# We attach discovery endpoints to root router or dmcp router
router = APIRouter(tags=["DMCP Protocol"])

class DMCPOfferRequest(BaseModel):
    product_id: str
    merchant_id: str
    offer_amount: float
    currency: str = "INR"
    agent_id: str
    authorization_token: Optional[str] = None
    round_number: int = 1

class DMCPDealLockRequest(BaseModel):
    product_id: str
    merchant_id: str
    final_price: float
    currency: str = "INR"
    buyer_authorization: str
    user_id: str = "user_buyer_default"
    negotiation_id: Optional[str] = None

class DMCPRenewRequest(BaseModel):
    deal_ref: str
    buyer_authorization: str

@router.get("/.well-known/dealmesh-agent")
async def get_well_known_agent_manifest():
    return MerchantDiscovery.get_well_known_manifest("DealMesh Network")

@router.get("/agent/capabilities")
async def get_agent_capabilities(merchant_id: str = "merchant_titan_demo", db: AsyncSession = Depends(get_db)):
    stmt = select(Merchant).where(Merchant.id == merchant_id)
    m = (await db.execute(stmt)).scalars().first()
    store_name = m.store_name if m else "Titan Demo Store"
    return MerchantDiscovery.get_well_known_manifest(store_name)

@router.get("/agent/inventory")
async def get_agent_inventory(product_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.id == product_id)
    prod = (await db.execute(stmt)).scalars().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "product_id": prod.id,
        "product_name": prod.name,
        "inventory": prod.inventory,
        "is_scarcity": prod.inventory <= 1,
        "last_verified_at": prod.last_verified_at.isoformat() if prod.last_verified_at else None
    }

@router.post("/agent/offer")
async def submit_agent_offer(req: DMCPOfferRequest, db: AsyncSession = Depends(get_db)):
    """
    DMCP Endpoint: Processes an authorized offer from a Buyer Agent.
    Evaluates against server-side private merchant policy without revealing private floor.
    """
    stmt = select(Product).options(selectinload(Product.policy), selectinload(Product.merchant).selectinload(Merchant.agent)).where(Product.id == req.product_id)
    prod = (await db.execute(stmt)).scalars().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    merchant_agent_model = prod.merchant.agent if prod.merchant else None
    agent_logic = MerchantAgentLogic(
        agent_name=merchant_agent_model.agent_name if merchant_agent_model else "TitanBot",
        personality=merchant_agent_model.personality if merchant_agent_model else "Pragmatic Seller",
        is_paused=merchant_agent_model.is_paused if merchant_agent_model else False,
        negotiation_enabled=merchant_agent_model.negotiation_enabled if merchant_agent_model else True
    )

    prod_data = {
        "id": prod.id,
        "listed_price": prod.listed_price,
        "inventory": prod.inventory,
        "policy": {
            "preferred_price": prod.policy.preferred_price if prod.policy else prod.listed_price * 0.9,
            "auto_negotiation_floor": prod.policy.auto_negotiation_floor if prod.policy else prod.listed_price * 0.85,
            "absolute_floor": prod.policy.absolute_floor if prod.policy else prod.listed_price * 0.80,
            "human_approval_threshold": prod.policy.human_approval_threshold if prod.policy else prod.listed_price * 0.85
        }
    }

    merchant_proposal = agent_logic.evaluate_buyer_offer(
        product=prod_data,
        buyer_offer=req.offer_amount,
        current_round=req.round_number
    )

    # Log audit event
    audit = AuditEvent(
        entity_type="DMCP_OFFER",
        entity_id=req.product_id,
        actor_type="BUYER_AGENT",
        actor_id=req.agent_id,
        action="SUBMIT_OFFER",
        details=json.dumps({
            "offered_price": req.offer_amount,
            "merchant_decision": merchant_proposal.action,
            "counter_price": merchant_proposal.counter_price
        })
    )
    db.add(audit)
    if merchant_proposal.action == "waiting_for_approval":
        await ws_manager.broadcast_event("approval.required", {
            "target": "MERCHANT",
            "merchant_id": prod.merchant_id,
            "product_id": req.product_id,
            "product_name": prod.name,
            "listed_price": prod.listed_price,
            "buyer_offer": req.offer_amount,
            "buyer_agent": req.agent_id,
            "reason": merchant_proposal.reason
        })

    # Never return absolute_floor in response
    return {
        "status": "SUCCESS",
        "action": merchant_proposal.action,
        "counter_price": merchant_proposal.counter_price,
        "reason": merchant_proposal.reason,
        "inventory_available": merchant_proposal.inventory_available,
        "scarcity_active": merchant_proposal.scarcity_active,
        "authorization_token": merchant_proposal.authorization_data.get("auth_token") if merchant_proposal.authorization_data else None
    }

@router.post("/agent/deal-lock")
async def create_deal_lock(req: DMCPDealLockRequest, db: AsyncSession = Depends(get_db)):
    """
    DMCP Endpoint: Locks an agreed price and temporarily reserves inventory.
    """
    stmt = select(Product).where(Product.id == req.product_id)
    prod = (await db.execute(stmt)).scalars().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if prod.inventory <= 0:
        raise HTTPException(status_code=400, detail="Product is out of stock")

    deal_ref = f"deal_{uuid.uuid4().hex[:12]}"
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)

    merchant_auth = create_authorization_token(
        agent_id="merchant_titan_agent",
        action="deal_lock",
        price=req.final_price
    )

    deal = Deal(
        deal_ref=deal_ref,
        negotiation_id=req.negotiation_id,
        user_id=req.user_id,
        merchant_id=req.merchant_id,
        product_id=req.product_id,
        listed_price=prod.listed_price,
        final_price=req.final_price,
        currency=req.currency,
        buyer_authorization=req.buyer_authorization,
        merchant_authorization=merchant_auth.get("auth_token", "valid_merchant_token"),
        inventory_reserved=True,
        status="LOCKED",
        expires_at=expires_at
    )
    db.add(deal)

    # Reserve inventory atomically
    prod.inventory = max(0, prod.inventory - 1)

    reservation = InventoryReservation(
        product_id=prod.id,
        negotiation_id=req.negotiation_id,
        deal_id=deal.id,
        buyer_agent_id="Omni",
        quantity=1,
        status="RESERVED",
        expires_at=expires_at
    )
    db.add(reservation)

    await db.commit()

    await ws_manager.broadcast_event("deal.locked", {
        "deal_id": deal.id,
        "deal_ref": deal.deal_ref,
        "product_name": prod.name,
        "final_price": deal.final_price,
        "savings": prod.listed_price - deal.final_price
    })

    return {
        "deal_id": deal.id,
        "deal_ref": deal.deal_ref,
        "product_id": deal.product_id,
        "final_price": deal.final_price,
        "currency": deal.currency,
        "inventory_reserved": True,
        "expires_at": deal.expires_at.isoformat(),
        "status": "LOCKED"
    }

@router.post("/agent/renew")
async def renew_expired_deal(req: DMCPRenewRequest, db: AsyncSession = Depends(get_db)):
    """
    DMCP Endpoint: Renews an expired locked deal if stock and pricing authority permit.
    """
    stmt = select(Deal).where(Deal.deal_ref == req.deal_ref)
    deal = (await db.execute(stmt)).scalars().first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Refresh expiration by 15 minutes
    deal.expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    deal.status = "LOCKED"
    await db.commit()

    return {
        "deal_ref": deal.deal_ref,
        "status": "RENEWED",
        "new_expires_at": deal.expires_at.isoformat(),
        "price": deal.final_price
    }

class DMCPSearchRequest(BaseModel):
    query: str
    min_price: float = 1000.0
    max_price: float = 3000.0
    merchant_id: Optional[str] = None

class DMCPCounterRequest(BaseModel):
    product_id: str
    merchant_id: str
    counter_amount: float
    round_number: int = 2
    agent_id: str = "buyer_agent"

class DMCPAcceptRequest(BaseModel):
    product_id: str
    merchant_id: str
    final_price: float
    buyer_authorization: str
    agent_id: str = "buyer_agent"

@router.post("/agent/search")
async def dmcp_agent_search(req: DMCPSearchRequest, db: AsyncSession = Depends(get_db)):
    """
    DMCP Endpoint: Standard multi-store catalog search for external AI Buyer agents.
    """
    from backend.app.commerce.search_provider import SearchProvider
    if req.merchant_id:
        res = await SearchProvider.search_merchant(
            merchant_id=req.merchant_id,
            query=req.query,
            min_price=req.min_price,
            max_price=req.max_price
        )
        return {"status": "SUCCESS", "products": res.get("products", [])}
    else:
        res = await SearchProvider.concurrent_market_search(
            query=req.query,
            min_price=req.min_price,
            max_price=req.max_price
        )
        return {"status": "SUCCESS", "products": res.get("products", []), "stores_checked": res.get("stores_checked", 0)}

@router.post("/agent/counter")
async def dmcp_agent_counter(req: DMCPCounterRequest, db: AsyncSession = Depends(get_db)):
    """
    DMCP Endpoint: Evaluates a counter-offer from a Buyer Agent against server-side private policy.
    """
    return await submit_agent_offer(
        DMCPOfferRequest(
            product_id=req.product_id,
            merchant_id=req.merchant_id,
            offer_amount=req.counter_amount,
            agent_id=req.agent_id,
            round_number=req.round_number
        ),
        db=db
    )

@router.post("/agent/accept")
async def dmcp_agent_accept(req: DMCPAcceptRequest, db: AsyncSession = Depends(get_db)):
    """
    DMCP Endpoint: Final acceptance of an agreed price, creating a locked deal and reserving inventory.
    """
    return await create_deal_lock(
        DMCPDealLockRequest(
            product_id=req.product_id,
            merchant_id=req.merchant_id,
            final_price=req.final_price,
            buyer_authorization=req.buyer_authorization,
            user_id="user_buyer_default"
        ),
        db=db
    )

