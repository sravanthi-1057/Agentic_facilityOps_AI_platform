import pytest
from app.agents.energy_agent import execute_energy_agent
from app.database import get_db_session
from app.routes.energy import seed_simulated_data

@pytest.fixture(scope="module")
def db_session():
    db = get_db_session()
    # Seed a few days of data
    seed_simulated_data(days=5, db=db)
    yield db
    db.close()

def test_langgraph_energy_agent_execution(db_session):
    result = execute_energy_agent(db=db_session, facility_id="all", lookback_days=5)

    assert result["status"] == "COMPLETED"
    assert result["execution_time_ms"] > 0
    assert len(result["steps"]) == 5  # 5 nodes executed
    assert result["records_analyzed"] > 0
    assert "anomalies_detected" in result
    assert "recommendations_generated" in result

    # Verify node names in order
    step_names = [s["node"] for s in result["steps"]]
    assert "Data Validation Node" in step_names
    assert "Energy Analysis Node" in step_names
    assert "Anomaly Detection Node" in step_names
    assert "Recommendation Generation Node" in step_names
    assert "Save Results Node" in step_names
