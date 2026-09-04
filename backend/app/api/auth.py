from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.session import get_db
from backend.app.database.models import User, Pet, BuyerPolicy, Merchant, MerchantAgent

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterBuyerRequest(BaseModel):
    name: str
    email: str
    pet_name: str = "Omni"
    pet_species: str = "Fox"
    pet_personality: str = "Playful"
    target_price: float = 2000.0
    auto_negotiation_cap: float = 2700.0
    absolute_max: float = 3000.0

class RegisterMerchantRequest(BaseModel):
    name: str
    email: str
    store_name: str
    description: str
    category: str = "Watches & Horology"
    agent_name: str = "TitanBot"
    agent_personality: str = "Pragmatic Seller"

@router.post("/register/buyer")
async def register_buyer(req: RegisterBuyerRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == req.email)
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        return {"message": "User already exists", "user_id": existing.id, "email": existing.email}

    user = User(
        name=req.name,
        email=req.email,
        role="buyer"
    )
    db.add(user)
    await db.flush()

    pet = Pet(
        user_id=user.id,
        name=req.pet_name,
        species=req.pet_species,
        personality=req.pet_personality,
        state="SLEEPING"
    )
    db.add(pet)

    policy = BuyerPolicy(
        user_id=user.id,
        target_price=req.target_price,
        auto_negotiation_cap=req.auto_negotiation_cap,
        absolute_max=req.absolute_max
    )
    db.add(policy)

    await db.commit()
    return {"message": "Buyer registered successfully", "user_id": user.id, "pet_name": pet.name}

@router.post("/register/merchant")
async def register_merchant(req: RegisterMerchantRequest, db: AsyncSession = Depends(get_db)):
    user = User(
        name=req.name,
        email=req.email,
        role="merchant"
    )
    db.add(user)
    await db.flush()

    merchant = Merchant(
        user_id=user.id,
        store_name=req.store_name,
        description=req.description,
        category=req.category,
        agent_supported=True,
        dmcp_endpoint="/agent"
    )
    db.add(merchant)
    await db.flush()

    agent = MerchantAgent(
        merchant_id=merchant.id,
        agent_name=req.agent_name,
        personality=req.agent_personality,
        negotiation_enabled=True
    )
    db.add(agent)

    await db.commit()
    return {"message": "Merchant registered successfully", "merchant_id": merchant.id, "agent_name": agent.agent_name}

class LoginRequest(BaseModel):
    email: str
    password: str = ""

@router.post("/login")
async def login_user(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == req.email)
    user = (await db.execute(stmt)).scalars().first()
    if not user:
        # If user doesn't exist, create an account for them automatically
        name_part = req.email.split("@")[0].replace(".", " ").title()
        user = User(
            name=name_part if name_part else "DealMesh User",
            email=req.email,
            role="buyer"
        )
        db.add(user)
        await db.flush()

        pet = Pet(
            user_id=user.id,
            name="Omni",
            species="Fox",
            personality="Playful",
            state="SLEEPING"
        )
        db.add(pet)

        policy = BuyerPolicy(
            user_id=user.id,
            target_price=2000.0,
            auto_negotiation_cap=2700.0,
            absolute_max=3000.0
        )
        db.add(policy)
        await db.commit()

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }

@router.get("/me")
async def get_current_user_profile(email: str = "buyer@dealmesh.ai", db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == email)
    user = (await db.execute(stmt)).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }
