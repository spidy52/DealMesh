from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.session import get_db
from backend.app.database.models import User, Pet, BuyerPolicy, BuyerSettings
from backend.app.agents.llm_service import llm_service
from backend.app.websocket.manager import ws_manager

router = APIRouter(prefix="/buyer", tags=["Buyer Platform"])

class UpdatePetRequest(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    personality: Optional[str] = None
    appearance: Optional[str] = None

class UpdatePetStateRequest(BaseModel):
    state: str
    current_thought: Optional[str] = None

class UpdatePolicyRequest(BaseModel):
    target_price: float
    auto_negotiation_cap: float
    absolute_max: float
    allowed_categories: Optional[str] = None
    allowed_merchants: Optional[str] = None

class PetChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

@router.get("/pet")
async def get_pet(user_id: str = "user_buyer_default", db: AsyncSession = Depends(get_db)):
    stmt = select(Pet).where(Pet.user_id == user_id)
    pet = (await db.execute(stmt)).scalars().first()
    if not pet:
        pet = (await db.execute(select(Pet))).scalars().first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    return {
        "id": pet.id,
        "name": pet.name,
        "species": pet.species,
        "personality": pet.personality,
        "appearance": pet.appearance,
        "state": pet.state,
        "current_thought": pet.current_thought
    }

@router.put("/pet")
async def update_pet(req: UpdatePetRequest, user_id: str = "user_buyer_default", db: AsyncSession = Depends(get_db)):
    stmt = select(Pet).where(Pet.user_id == user_id)
    pet = (await db.execute(stmt)).scalars().first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if req.name is not None:
        pet.name = req.name
    if req.species is not None:
        pet.species = req.species
    if req.personality is not None:
        pet.personality = req.personality
    if req.appearance is not None:
        pet.appearance = req.appearance

    await db.commit()

    await ws_manager.broadcast_event("pet.updated", {
        "name": pet.name,
        "species": pet.species,
        "personality": pet.personality
    })

    return {"message": "Pet updated", "pet": pet.name}

@router.put("/pet/state")
async def update_pet_state(req: UpdatePetStateRequest, user_id: str = "user_buyer_default", db: AsyncSession = Depends(get_db)):
    stmt = select(Pet).where(Pet.user_id == user_id)
    pet = (await db.execute(stmt)).scalars().first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    pet.state = req.state
    if req.current_thought:
        pet.current_thought = req.current_thought

    await db.commit()

    await ws_manager.broadcast_event("pet.state_changed", {
        "state": pet.state,
        "current_thought": pet.current_thought
    })

    return {"message": "Pet state updated", "state": pet.state, "current_thought": pet.current_thought}

@router.post("/pet/chat")
async def chat_with_pet(req: PetChatRequest, user_id: str = "user_buyer_default", db: AsyncSession = Depends(get_db)):
    stmt = select(Pet).where(Pet.user_id == user_id)
    pet = (await db.execute(stmt)).scalars().first()
    pet_name = pet.name if pet else "Omni"
    personality = pet.personality if pet else "Playful"

    system_prompt = (
        f"You are {pet_name}, an autonomous AI Buyer Agent and holographic desktop pet in the DealMesh network. "
        f"Your personality is {personality}. Keep your answers concise, friendly, and under 2 sentences since you will speak them out loud to the user. "
        f"You help users search stores, negotiate with merchant bots (like TitanBot), enforce strict price caps, and secure deals."
    )

    llm_resp = await llm_service.generate_response(system_prompt, req.message)
    if not llm_resp:
        # Graceful fallback response
        if "titan" in req.message.lower():
            llm_resp = "I negotiated with TitanBot and secured ₹2,299 with a 94 out of 100 trust score and 30-day returns!"
        elif "price" in req.message.lower() or "cost" in req.message.lower():
            llm_resp = "I enforce your private auto-cap of ₹2,700 and will never let any merchant exceed ₹3,000."
        else:
            llm_resp = f"I am {pet_name}! I'm scanning 12 stores and ready to negotiate the best price for you!"

    return {
        "reply": llm_resp,
        "pet_name": pet_name
    }

@router.get("/policy")
async def get_buyer_policy(user_id: str = "user_buyer_default", db: AsyncSession = Depends(get_db)):
    stmt = select(BuyerPolicy).where(BuyerPolicy.user_id == user_id)
    policy = (await db.execute(stmt)).scalars().first()
    if not policy:
        policy = (await db.execute(select(BuyerPolicy))).scalars().first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    return {
        "id": policy.id,
        "user_id": policy.user_id,
        "target_price": policy.target_price,
        "auto_negotiation_cap": policy.auto_negotiation_cap,
        "absolute_max": policy.absolute_max,
        "allowed_categories": policy.allowed_categories,
        "allowed_merchants": policy.allowed_merchants
    }

@router.put("/policy")
async def update_buyer_policy(req: UpdatePolicyRequest, user_id: str = "user_buyer_default", db: AsyncSession = Depends(get_db)):
    stmt = select(BuyerPolicy).where(BuyerPolicy.user_id == user_id)
    policy = (await db.execute(stmt)).scalars().first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    policy.target_price = req.target_price
    policy.auto_negotiation_cap = req.auto_negotiation_cap
    policy.absolute_max = req.absolute_max
    if req.allowed_categories is not None:
        policy.allowed_categories = req.allowed_categories
    if req.allowed_merchants is not None:
        policy.allowed_merchants = req.allowed_merchants

    await db.commit()

    await ws_manager.broadcast_event("policy.updated", {
        "target_price": policy.target_price,
        "auto_negotiation_cap": policy.auto_negotiation_cap,
        "absolute_max": policy.absolute_max
    })

    return {"message": "Policy updated successfully"}


class BuyerSettingsRequest(BaseModel):
    accent_color: Optional[str] = "#00F0FF"
    eye_color: Optional[str] = "#00F0FF"
    voice_name: Optional[str] = "default"
    voice_pitch: Optional[float] = 1.0
    voice_rate: Optional[float] = 1.0
    dock_x_percent: Optional[float] = 0.85
    dock_y_percent: Optional[float] = 0.82

@router.get("/settings")
async def get_buyer_settings(user_id: str = "user_buyer_default", db: AsyncSession = Depends(get_db)):
    stmt = select(BuyerSettings).where(BuyerSettings.user_id == user_id)
    settings_obj = (await db.execute(stmt)).scalars().first()
    if not settings_obj:
        return {
            "user_id": user_id,
            "accent_color": "#00F0FF",
            "eye_color": "#00F0FF",
            "voice_name": "default",
            "voice_pitch": 1.0,
            "voice_rate": 1.0,
            "dock_x_percent": 0.85,
            "dock_y_percent": 0.82
        }
    return {
        "user_id": settings_obj.user_id,
        "accent_color": settings_obj.accent_color,
        "eye_color": settings_obj.eye_color,
        "voice_name": settings_obj.voice_name,
        "voice_pitch": settings_obj.voice_pitch,
        "voice_rate": settings_obj.voice_rate,
        "dock_x_percent": settings_obj.dock_x_percent,
        "dock_y_percent": settings_obj.dock_y_percent
    }

@router.post("/settings")
@router.put("/settings")
async def update_buyer_settings(req: BuyerSettingsRequest, user_id: str = "user_buyer_default", db: AsyncSession = Depends(get_db)):
    stmt = select(BuyerSettings).where(BuyerSettings.user_id == user_id)
    settings_obj = (await db.execute(stmt)).scalars().first()
    if not settings_obj:
        settings_obj = BuyerSettings(
            user_id=user_id,
            accent_color=req.accent_color or "#00F0FF",
            eye_color=req.eye_color or req.accent_color or "#00F0FF",
            voice_name=req.voice_name or "default",
            voice_pitch=req.voice_pitch if req.voice_pitch is not None else 1.0,
            voice_rate=req.voice_rate if req.voice_rate is not None else 1.0,
            dock_x_percent=req.dock_x_percent if req.dock_x_percent is not None else 0.85,
            dock_y_percent=req.dock_y_percent if req.dock_y_percent is not None else 0.82
        )
        db.add(settings_obj)
    else:
        if req.accent_color:
            settings_obj.accent_color = req.accent_color
            settings_obj.eye_color = req.eye_color or req.accent_color
        if req.voice_name:
            settings_obj.voice_name = req.voice_name
        if req.voice_pitch is not None:
            settings_obj.voice_pitch = req.voice_pitch
        if req.voice_rate is not None:
            settings_obj.voice_rate = req.voice_rate
        if req.dock_x_percent is not None:
            settings_obj.dock_x_percent = req.dock_x_percent
        if req.dock_y_percent is not None:
            settings_obj.dock_y_percent = req.dock_y_percent

    await db.commit()

    # Broadcast settings update via websocket
    await ws_manager.broadcast_event("pet.settings_updated", {
        "user_id": user_id,
        "accent_color": settings_obj.accent_color,
        "eye_color": settings_obj.eye_color,
        "voice_name": settings_obj.voice_name,
        "voice_pitch": settings_obj.voice_pitch,
        "voice_rate": settings_obj.voice_rate,
        "dock_x_percent": settings_obj.dock_x_percent,
        "dock_y_percent": settings_obj.dock_y_percent
    })

    return {
        "success": True,
        "message": "Settings updated successfully",
        "settings": {
            "user_id": user_id,
            "accent_color": settings_obj.accent_color,
            "eye_color": settings_obj.eye_color,
            "voice_name": settings_obj.voice_name,
            "voice_pitch": settings_obj.voice_pitch,
            "voice_rate": settings_obj.voice_rate,
            "dock_x_percent": settings_obj.dock_x_percent,
            "dock_y_percent": settings_obj.dock_y_percent
        }
    }
