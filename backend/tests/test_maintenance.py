import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db_session, Asset, MaintenanceAlert, MaintenanceSchedule, MaintenancePrediction
from app.services.asset_simulator import asset_simulator

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_maintenance_test_db():
    db = get_db_session()
    asset_simulator.seed_initial_assets(db)
    db.close()

def test_maintenance_kpis_endpoint():
    res = client.get("/api/maintenance/kpis")
    assert res.status_code == 200
    data = res.json()
    assert "total_assets_count" in data
    assert data["total_assets_count"] >= 10
    assert "healthy_assets_count" in data
    assert "critical_assets_count" in data
    assert "health_distribution" in data
    assert len(data["health_distribution"]) == 5
    assert "asset_type_distribution" in data

def test_assets_list_and_filters():
    res = client.get("/api/maintenance/assets")
    assert res.status_code == 200
    assets = res.json()
    assert len(assets) >= 10
    first_asset = assets[0]
    assert "asset_id" in first_asset
    assert "health_score" in first_asset
    assert "failure_risk_pct" in first_asset
    assert "temperature" in first_asset
    assert "vibration" in first_asset

    # Filter by type
    res_type = client.get("/api/maintenance/assets?asset_type=Chiller")
    assert res_type.status_code == 200
    chillers = res_type.json()
    assert all(a["asset_type"] == "Chiller" for a in chillers)

    # Filter by facility
    res_fac = client.get("/api/maintenance/assets?facility_id=FAC-001")
    assert res_fac.status_code == 200
    assert all(a["facility_id"] == "FAC-001" for a in res_fac.json())

def test_asset_detail_with_sensors_and_factors():
    res = client.get("/api/maintenance/assets/AST-CHL-001")
    assert res.status_code == 200
    detail = res.json()
    assert detail["asset_id"] == "AST-CHL-001"
    assert "nominal_spec" in detail
    assert "contributing_factors" in detail
    assert "sensor_history" in detail
    assert "health_history" in detail

def test_sensor_telemetry_refresh():
    res = client.post("/api/maintenance/telemetry/refresh")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "TELEMETRY_REFRESHED"
    assert data["assets_updated"] >= 10

def test_alert_lifecycle_acknowledge_and_resolve():
    db = get_db_session()
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.status == "NEW").first()
    if not alert:
        alert = MaintenanceAlert(
            asset_id="AST-CHL-001",
            facility_id="FAC-001",
            floor="Basement",
            title="Test Sensor Alert",
            description="Testing alert lifecycle",
            severity="High",
            recommended_action="Inspect unit",
            status="NEW"
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
    alert_id = alert.alert_id
    db.close()

    # Acknowledge
    res_ack = client.post(f"/api/maintenance/alerts/{alert_id}/acknowledge")
    assert res_ack.status_code == 200
    assert res_ack.json()["status"] == "ACKNOWLEDGED"

    # Resolve
    res_res = client.post(f"/api/maintenance/alerts/{alert_id}/resolve")
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"
    assert res_res.json()["resolved_at"] is not None

def test_alerts_endpoint_data_and_counts():
    res = client.get("/api/maintenance/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) > 0
    first = alerts[0]
    assert "alert_id" in first
    assert "asset_id" in first
    assert "asset_name" in first
    assert "severity" in first
    assert "status" in first
    assert "title" in first
    assert "description" in first

    # Severity filter
    res_crit = client.get("/api/maintenance/alerts?severity=critical")
    assert res_crit.status_code == 200
    for a in res_crit.json():
        assert a["severity"].lower() == "critical"

def test_schedules_crud_and_completion():
    # Create schedule
    new_task = {
        "asset_id": "AST-AHU-001",
        "title": "Comprehensive Vibration & Bearing Lubrication",
        "description": "Lubricate pillow block bearings and inspect motor mount isolators.",
        "scheduled_date": (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat(),
        "priority": "High",
        "assigned_technician": "Priya Nair",
        "notes": "Preventive task"
    }
    res_create = client.post("/api/maintenance/schedules", json=new_task)
    assert res_create.status_code == 200
    sched = res_create.json()
    sched_id = sched["schedule_id"]
    assert sched["status"] == "SCHEDULED"
    assert "work_order_id" in sched
    assert sched["work_order_id"].startswith("WO-")

    # Update schedule
    res_update = client.put(f"/api/maintenance/schedules/{sched_id}", json={"priority": "Critical"})
    assert res_update.status_code == 200
    assert res_update.json()["priority"] == "Critical"

    # Complete schedule and verify asset health restoration
    res_comp = client.post(f"/api/maintenance/schedules/{sched_id}/complete", json={"notes": "All bearings greased."})
    assert res_comp.status_code == 200
    assert res_comp.json()["status"] == "COMPLETED"
    assert res_comp.json()["completed_at"] is not None

    # Verify asset health was updated
    res_asset = client.get("/api/maintenance/assets/AST-AHU-001")
    assert res_asset.status_code == 200
    assert res_asset.json()["health_score"] >= 80

def test_predictions_endpoint_and_attributes():
    res = client.get("/api/maintenance/predictions")
    assert res.status_code == 200
    preds = res.json()
    assert isinstance(preds, list)
    assert len(preds) > 0
    p = preds[0]
    assert "asset_id" in p
    assert "asset_name" in p
    assert "health_score" in p
    assert "failure_risk_pct" in p
    assert "risk_level" in p
    assert "estimated_days_to_failure" in p
    assert "recommendation" in p
    assert "reason" in p

    # Filter by risk level
    res_crit = client.get("/api/maintenance/predictions?risk_level=critical")
    assert res_crit.status_code == 200
    crit_preds = res_crit.json()
    assert all(cp["risk_level"].lower() == "critical" for cp in crit_preds)

def test_langgraph_maintenance_agent_execution_and_persistence():
    # 1. Run agent
    res = client.post("/api/maintenance/analyze?facility_id=all")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert len(data["steps"]) == 7  # 7-node workflow
    assert data["assets_analyzed"] >= 10
    assert data["predictions_count"] >= 10
    assert "execution_time_ms" in data
    assert "summary_message" in data

    # 2. Verify all 7 nodes executed in order
    step_nodes = [s["node"] for s in data["steps"]]
    assert "Asset Telemetry Validation Node" in step_nodes
    assert "Equipment Condition Analysis Node" in step_nodes
    assert "Health Score Calculation Node" in step_nodes
    assert "Failure Risk Prediction Node" in step_nodes
    assert "Maintenance Recommendation Node" in step_nodes
    assert "Alert Generation Node" in step_nodes
    assert "Database Persistence Node" in step_nodes

    # 3. Verify predictions are retrievable via API
    res_preds = client.get("/api/maintenance/predictions")
    assert res_preds.status_code == 200
    assert len(res_preds.json()) >= 10

    # 4. Verify re-running the agent does not create duplicate alerts
    res_again = client.post("/api/maintenance/analyze?facility_id=all")
    assert res_again.status_code == 200
    data_again = res_again.json()
    assert data_again["status"] == "COMPLETED"
    assert data_again["alerts_generated"] == 0  # No duplicate alerts created
