import os
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database.seed import seed_database
from backend.app.websocket.manager import ws_manager

# Import API Routers
from backend.app.api.auth import router as auth_router
from backend.app.api.buyer import router as buyer_router
from backend.app.api.merchant import router as merchant_router
from backend.app.api.search import router as search_router
from backend.app.api.dmcp import router as dmcp_router
from backend.app.api.negotiations import router as negotiations_router
from backend.app.api.deals import router as deals_router
from backend.app.api.payments import router as payments_router
from backend.app.api.webhooks import router as webhooks_router
from backend.app.api.recovery import router as recovery_router
from backend.app.api.audit import router as audit_router
from backend.app.api.voice import router as voice_router
from backend.app.api.pet import router as pet_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables and initial seed exist on startup
    try:
        await seed_database()
    except Exception as e:
        print(f"Startup DB seed check: {e}")
    yield

app = FastAPI(
    title="DealMesh API",
    description="Two-Sided AI Commerce Network Protocol & Marketplace Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(buyer_router, prefix="/api")
app.include_router(merchant_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(dmcp_router)  # DMCP discovery at /.well-known & /agent
app.include_router(dmcp_router, prefix="/api")
app.include_router(negotiations_router, prefix="/api")
app.include_router(deals_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(webhooks_router, prefix="/api")
app.include_router(recovery_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(voice_router, prefix="/api")
app.include_router(pet_router, prefix="/api")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "DealMesh Core API",
        "protocol": "DMCP v1.0",
        "razorpay_mode": "test"
    }

@app.websocket("/ws")
@app.websocket("/ws/pet")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or channel subscription can be processed here
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
