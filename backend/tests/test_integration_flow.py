import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_full_api_integration_flow():
    """End-to-end integration test verifying root landing and health endpoints through ASGI transport."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        root_res = await client.get("/")
        assert root_res.status_code == 200
        root_data = root_res.json()
        assert "message" in root_data
        assert root_data["health"] == "/api/v1/health"

        health_res = await client.get(root_data["health"])
        assert health_res.status_code == 200
        health_data = health_res.json()
        assert health_data["status"] == "healthy"
        assert health_data["connectivity"]["api"] == "connected"
