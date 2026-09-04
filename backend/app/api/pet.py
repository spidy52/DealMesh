from fastapi import APIRouter
from pydantic import BaseModel, Field
import datetime
from typing import Dict, Any, Optional
from backend.app.websocket.manager import ws_manager

router = APIRouter(prefix="/pet", tags=["pet"])

class DockPositionPayload(BaseModel):
    x_percent: float = Field(0.5, ge=0.0, le=1.0, description="Horizontal position ratio (0.0=left, 1.0=right)")
    y_percent: float = Field(0.80, ge=0.0, le=1.0, description="Vertical position ratio (0.0=top, 1.0=bottom)")
    user_id: Optional[str] = "user_buyer_default"

# In-memory store with default bottom-center (above taskbar)
current_dock_config: Dict[str, Any] = {
    "x_percent": 0.85,
    "y_percent": 0.82,
    "updated_at": datetime.datetime.utcnow().isoformat()
}

@router.get("/dock-position")
async def get_dock_position(user_id: Optional[str] = None):
    return {
        "success": True,
        "dock": current_dock_config
    }

@router.post("/dock-position")
async def set_dock_position(payload: DockPositionPayload):
    current_dock_config["x_percent"] = payload.x_percent
    current_dock_config["y_percent"] = payload.y_percent
    current_dock_config["updated_at"] = datetime.datetime.utcnow().isoformat()

    # Broadcast dock change to desktop and buyer app
    await ws_manager.broadcast_event("pet.dock_updated", {
        "x_percent": payload.x_percent,
        "y_percent": payload.y_percent,
        "user_id": payload.user_id or "user_buyer_default"
    })

    return {
        "success": True,
        "message": f"Pet dock position updated to X: {int(payload.x_percent*100)}%, Y: {int(payload.y_percent*100)}%",
        "dock": current_dock_config
    }
