import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.session import get_db
from backend.app.database.models import Deal, Payment, Product, BuyerPolicy
from backend.app.agents.recovery_agent import RecoveryAgent
from backend.app.websocket.manager import ws_manager

router = APIRouter(prefix="/recovery", tags=["Failure Recovery"])

class TriggerRecoveryRequest(BaseModel):
    deal_id: str
    user_id: str = "user_buyer_default"
    attempt_number: int = 1

@router.post("/execute")
async def execute_recovery(req: TriggerRecoveryRequest, db: AsyncSession = Depends(get_db)):
    """
    Executes automated 2-step bounded deal recovery when a payment or lock failure occurs.
    """
    deal_stmt = select(Deal).where((Deal.id == req.deal_id) | (Deal.deal_ref == req.deal_id))
    deal = (await db.execute(deal_stmt)).scalars().first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    prod_stmt = select(Product).where(Product.id == deal.product_id)
    prod = (await db.execute(prod_stmt)).scalars().first()

    policy_stmt = select(BuyerPolicy).where(BuyerPolicy.user_id == req.user_id)
    buyer_policy = (await db.execute(policy_stmt)).scalars().first()

    deal_dict = {
        "final_price": deal.final_price,
        "status": deal.status,
        "expires_at": deal.expires_at
    }
    prod_dict = {
        "inventory": prod.inventory if prod else 5
    }
    policy_dict = {
        "auto_negotiation_cap": buyer_policy.auto_negotiation_cap if buyer_policy else 2700.0,
        "absolute_max": buyer_policy.absolute_max if buyer_policy else 3000.0
    }

    # Execute recovery reasoning
    recovery_plan = RecoveryAgent.handle_payment_failure(
        deal_data=deal_dict,
        product_data=prod_dict,
        buyer_policy=policy_dict,
        current_attempt=req.attempt_number
    )

    if recovery_plan.action in ["RETRY_PAYMENT", "RENEW_LOCK"]:
        # Refresh deal expiry and set to LOCKED
        deal.expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        deal.status = "LOCKED"
        await db.commit()

    await ws_manager.broadcast_event("recovery.started", {
        "deal_id": deal.id,
        "action": recovery_plan.action,
        "attempt": recovery_plan.attempt_number,
        "message": recovery_plan.message,
        "is_recoverable": recovery_plan.is_recoverable
    })

    return {
        "deal_id": deal.id,
        "action": recovery_plan.action,
        "attempt_number": recovery_plan.attempt_number,
        "message": recovery_plan.message,
        "is_recoverable": recovery_plan.is_recoverable,
        "deal_status": deal.status,
        "new_expires_at": deal.expires_at.isoformat()
    }
