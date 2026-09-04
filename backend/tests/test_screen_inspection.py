import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.commerce.live_screen_inspector import LiveScreenAndPageInspector

def test_screen_inspector_snapshot():
    # Verify desktop screen capture does not raise exceptions
    snap = LiveScreenAndPageInspector.capture_active_screen_snapshot()
    # On desktop environments it should produce a path or None safely
    assert snap is None or isinstance(snap, str)

@pytest.mark.asyncio
async def test_screen_inspection_voice_chat():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test asking about screen
        resp = await ac.post("/api/voice/chat", json={"message": "what is on my screen?"})
        assert resp.status_code == 200
        data = resp.json()
        assert "screen" in data["reply"].lower()

@pytest.mark.asyncio
async def test_screen_product_selection_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Simulate selecting a product directly
        resp = await ac.post("/api/voice/chat", json={"message": "select product Cape Jasmine"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["action"] in ["show_deal_overlay", "show_variant_picker", "show_screen_products", "none"]
