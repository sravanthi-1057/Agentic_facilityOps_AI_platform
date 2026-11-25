import pytest
import pandas as pd
from app.analytics.engine import EnergyAnalyticsEngine
from app.database import get_db_session
from app.services.iot_simulator import simulator

@pytest.fixture(scope="module")
def db_session():
    db = get_db_session()
    yield db
    db.close()

def test_kpi_calculations_with_synthetic_data(db_session):
    df = simulator.generate_timeseries(days=3)
    analytics = EnergyAnalyticsEngine(db_session)
    kpis = analytics.compute_kpis(df)

    assert "total_electricity_kwh" in kpis
    assert kpis["total_electricity_kwh"] > 0
    assert kpis["total_water_litres"] > 0
    assert kpis["estimated_cost_usd"] > 0
    assert 50 <= kpis["energy_efficiency_score"] <= 100
    assert kpis["carbon_emissions_kg"] > 0
    assert kpis["peak_demand_kwh"] >= kpis["avg_hourly_kwh"]

def test_distribution_breakdown(db_session):
    df = simulator.generate_timeseries(days=3)
    analytics = EnergyAnalyticsEngine(db_session)
    dist = analytics.compute_distribution(df)

    assert "categories" in dist
    assert len(dist["categories"]) == 4  # HVAC, Lighting, Equipment, Other
    assert "floor_wise" in dist
    assert len(dist["floor_wise"]) > 0

    total_cat_pct = sum(c["percentage"] for c in dist["categories"])
    assert 99.0 <= total_cat_pct <= 101.0
