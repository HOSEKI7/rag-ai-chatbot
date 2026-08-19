import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    """Verify that the health check endpoint returns 200 and valid service metadata with connectivity."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "contexure-backend"
    assert "version" in data
    assert "environment" in data
    assert "connectivity" in data
    assert data["connectivity"]["api"] == "connected"
