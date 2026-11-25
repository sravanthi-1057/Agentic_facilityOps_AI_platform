import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db_session
from app.routes.energy import seed_simulated_data

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    db = get_db_session()
    seed_simulated_data(days=5, db=db)
    db.close()

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["is_simulated"] is True
    assert "databases" in data

def test_facilities_endpoint():
    res = client.get("/api/facilities")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert "facility_id" in data[0]

def test_energy_summary_endpoint():
    res = client.get("/api/energy/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_electricity_kwh" in data
    assert data["total_electricity_kwh"] > 0
    assert "energy_efficiency_score" in data

def test_energy_consumption_endpoint():
    res = client.get("/api/energy/consumption?interval=hourly")
    assert res.status_code == 200
    data = res.json()
    assert "data" in data
    assert len(data["data"]) > 0

def test_energy_distribution_endpoint():
    res = client.get("/api/energy/distribution")
    assert res.status_code == 200
    data = res.json()
    assert "categories" in data
    assert "floor_wise" in data

def test_anomalies_endpoint():
    res = client.get("/api/energy/anomalies")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_recommendations_endpoint():
    res = client.get("/api/energy/recommendations")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_forecast_endpoint():
    res = client.get("/api/energy/forecast")
    assert res.status_code == 200
    data = res.json()
    assert "forecast" in data
    assert len(data["forecast"]) > 0

def test_agent_analyze_endpoint():
    res = client.post("/api/energy/analyze", json={"facility_id": "all", "lookback_days": 3})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert len(data["steps"]) == 5
