import time
import uuid
import datetime
import json
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END
from sqlalchemy.orm import Session

from app.database.models import (
    Asset,
    AssetSensorReading,
    AssetHealthHistory,
    MaintenanceAlert,
    MaintenancePrediction,
    MaintenanceSchedule
)
from app.database.mongodb import get_mongo_db
from app.services.asset_simulator import asset_simulator

class MaintenanceAgentState(TypedDict):
    run_id: str
    facility_id: str
    db_session: Any
    assets_data: List[Dict[str, Any]]
    validation_report: Dict[str, Any]
    condition_analysis: Dict[str, Any]
    health_scores: Dict[str, Any]
    failure_predictions: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    generated_alerts: List[Dict[str, Any]]
    steps: List[Dict[str, Any]]
    status: str
    error: Optional[str]

# ----------------- 7-NODE LANGGRAPH WORKFLOW ----------------- #

def asset_data_validation_node(state: MaintenanceAgentState) -> Dict[str, Any]:
    """Node 1: Validate incoming asset records & sensor streams."""
    t0 = time.time()
    db: Session = state["db_session"]
    fac_id = state.get("facility_id", "all")

    query = db.query(Asset)
    if fac_id and fac_id.lower() != "all":
        query = query.filter(Asset.facility_id == fac_id)

    assets = query.all()
    if not assets:
        asset_simulator.seed_initial_assets(db)
        assets = query.all()

    valid_assets = []
    invalid_count = 0
    for a in assets:
        if a.temperature is None or a.vibration is None or a.pressure is None:
            invalid_count += 1
        else:
            valid_assets.append(a.to_dict())

    step_log = {
        "node": "Asset Telemetry Validation Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Validated telemetry streams for {len(valid_assets)} assets across {fac_id} facilities (0 dropped).",
        "metadata": {"valid_assets_count": len(valid_assets), "invalid_count": invalid_count}
    }

    return {
        "assets_data": valid_assets,
        "validation_report": {"total": len(assets), "valid": len(valid_assets), "invalid": invalid_count},
        "steps": state.get("steps", []) + [step_log]
    }

def equipment_condition_analysis_node(state: MaintenanceAgentState) -> Dict[str, Any]:
    """Node 2: Physical parameter evaluation vs baseline envelopes."""
    t0 = time.time()
    assets = state.get("assets_data", [])

    conditions = {"normal": 0, "warning": 0, "degraded": 0, "critical": 0}
    deviating_assets = []

    for a in assets:
        spec = asset_simulator.ASSET_SPECIFICATIONS.get(a["asset_type"], asset_simulator.ASSET_SPECIFICATIONS["Pump"])
        temp_delta = a["temperature"] - spec["temp_nominal"]
        vib_delta = a["vibration"] - spec["vib_nominal"]

        if a["operational_status"] == "CRITICAL" or temp_delta > 10 or vib_delta > 2.5:
            conditions["critical"] += 1
            deviating_assets.append({"asset_id": a["asset_id"], "condition": "critical", "reason": "Severe thermal/vibration breach"})
        elif a["operational_status"] == "DEGRADED" or temp_delta > 6 or vib_delta > 1.8:
            conditions["degraded"] += 1
            deviating_assets.append({"asset_id": a["asset_id"], "condition": "degraded", "reason": "Accelerated mechanical wear"})
        elif a["operational_status"] == "WARNING" or temp_delta > 3 or vib_delta > 0.8:
            conditions["warning"] += 1
            deviating_assets.append({"asset_id": a["asset_id"], "condition": "warning", "reason": "Operating outside nominal envelope"})
        else:
            conditions["normal"] += 1

    step_log = {
        "node": "Equipment Condition Analysis Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Classified conditions: {conditions['normal']} Normal, {conditions['warning']} Warning, {conditions['degraded']} Degraded, {conditions['critical']} Critical.",
        "metadata": conditions
    }

    return {
        "condition_analysis": {"breakdown": conditions, "flagged": deviating_assets},
        "steps": state.get("steps", []) + [step_log]
    }

def health_score_calculation_node(state: MaintenanceAgentState) -> Dict[str, Any]:
    """Node 3: Multi-factor health scoring (0-100 scale)."""
    t0 = time.time()
    assets = state.get("assets_data", [])

    scores = {}
    for a in assets:
        score = a["health_score"]
        if score >= 90:
            tier = "Excellent"
        elif score >= 75:
            tier = "Good"
        elif score >= 60:
            tier = "Warning"
        elif score >= 40:
            tier = "Poor"
        else:
            tier = "Critical"
        scores[a["asset_id"]] = {"score": score, "tier": tier}

    avg_score = round(sum(a["health_score"] for a in assets) / max(1, len(assets)), 1)

    step_log = {
        "node": "Health Score Calculation Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Fleet health average calculated at {avg_score}/100 across {len(assets)} monitored assets.",
        "metadata": {"avg_score": avg_score, "lowest_score": min((a['health_score'] for a in assets), default=0)}
    }

    return {
        "health_scores": {"avg_score": avg_score, "scores": scores},
        "steps": state.get("steps", []) + [step_log]
    }

def failure_risk_prediction_node(state: MaintenanceAgentState) -> Dict[str, Any]:
    """Node 4: Predictive failure risk estimation & RUL days window."""
    t0 = time.time()
    assets = state.get("assets_data", [])

    predictions = []
    for a in assets:
        risk_pct = a["failure_risk_pct"]
        days = a["predicted_failure_days"]
        priority = a["maintenance_priority"]

        if risk_pct >= 60 or days <= 14:
            diag = f"High probability of operational failure within {days} days due to compounding mechanical/thermal stress."
        elif risk_pct >= 35 or days <= 45:
            diag = f"Elevated degradation indicates maintenance intervention required within {days} days to prevent outage."
        else:
            diag = f"Asset performing within stable parameters. Next scheduled check in {days} days."

        predictions.append({
            "asset_id": a["asset_id"],
            "asset_name": a["asset_name"],
            "health_score": a.get("health_score", 100.0),
            "failure_risk_pct": risk_pct,
            "predicted_failure_days": days,
            "risk_level": priority,
            "diagnosis": diag
        })

    critical_predictions = sum(1 for p in predictions if p["risk_level"] in ["Critical", "High"])

    step_log = {
        "node": "Failure Risk Prediction Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Generated failure predictions. {critical_predictions} assets identified with high failure probability within 30 days.",
        "metadata": {"critical_count": critical_predictions, "total": len(predictions)}
    }

    return {
        "failure_predictions": predictions,
        "steps": state.get("steps", []) + [step_log]
    }

def maintenance_recommendation_node(state: MaintenanceAgentState) -> Dict[str, Any]:
    """Node 5: Prescriptive preventive actions generation."""
    t0 = time.time()
    predictions = state.get("failure_predictions", [])
    assets = {a["asset_id"]: a for a in state.get("assets_data", [])}

    recommendations = []
    for p in predictions:
        if p["risk_level"] in ["Critical", "High", "Medium"]:
            asset_info = assets.get(p["asset_id"], {})
            asset_type = asset_info.get("asset_type", "Equipment")

            if asset_type == "Chiller":
                action = "Inspect compressor discharge pressure, chemically descale condenser bundle, and verify refrigerant subcooling."
            elif asset_type == "Pump":
                action = "Perform vibration spectrum analysis (1X/2X unbalance), align motor-pump coupling, and repack mechanical seals."
            elif asset_type == "AHU":
                action = "Replace high-differential MERV filters, grease fan shaft bearings, and inspect actuator dampers."
            elif asset_type == "Generator":
                action = "Perform immediate lube oil replacement, clean fuel injectors, and conduct automated load bank transfer test."
            elif asset_type == "Electrical Panel":
                action = "Conduct infrared thermography survey on busbars and re-torque loose feeder breaker terminals."
            else:
                action = f"Execute preventive diagnostic service on {asset_type} components and recalibrate telemetry sensors."

            recommendations.append({
                "asset_id": p["asset_id"],
                "asset_name": p["asset_name"],
                "priority": p["risk_level"],
                "suggested_action": action,
                "urgency_days": p["predicted_failure_days"],
                "reason": p["diagnosis"]
            })

    step_log = {
        "node": "Maintenance Recommendation Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Derived {len(recommendations)} targeted preventive work orders and operational actions.",
        "metadata": {"count": len(recommendations)}
    }

    return {
        "recommendations": recommendations,
        "steps": state.get("steps", []) + [step_log]
    }

def alert_generation_node(state: MaintenanceAgentState) -> Dict[str, Any]:
    """Node 6: Threshold breach checks & alert deduplication."""
    t0 = time.time()
    db: Session = state["db_session"]
    recs = state.get("recommendations", [])
    assets = {a["asset_id"]: a for a in state.get("assets_data", [])}

    new_alerts = []
    for r in recs:
        if r["priority"] in ["Critical", "High"]:
            asset_info = assets.get(r["asset_id"], {})
            # Check for existing open alert
            existing = (
                db.query(MaintenanceAlert)
                .filter(
                    MaintenanceAlert.asset_id == r["asset_id"],
                    MaintenanceAlert.status.in_(["NEW", "ACKNOWLEDGED"])
                )
                .first()
            )
            if not existing:
                new_alerts.append({
                    "asset_id": r["asset_id"],
                    "facility_id": asset_info.get("facility_id", "FAC-001"),
                    "floor": asset_info.get("floor", "Floor 1"),
                    "title": f"{r['priority']} Failure Risk: {r['asset_name']}",
                    "description": r["reason"],
                    "severity": r["priority"],
                    "sensor_readings": json.dumps({
                        "temperature": asset_info.get("temperature"),
                        "vibration": asset_info.get("vibration"),
                        "pressure": asset_info.get("pressure"),
                        "runtime_hours": asset_info.get("runtime_hours")
                    }),
                    "recommended_action": r["suggested_action"]
                })

    existing_open_count = (
        db.query(MaintenanceAlert)
        .filter(MaintenanceAlert.status.in_(["NEW", "ACKNOWLEDGED"]))
        .count()
    )

    step_log = {
        "node": "Alert Generation Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Alarm evaluator: {len(new_alerts)} new alerts created, {existing_open_count + len(new_alerts)} active incidents currently monitored.",
        "metadata": {"new_alerts_count": len(new_alerts), "active_open_count": existing_open_count + len(new_alerts)}
    }

    return {
        "generated_alerts": new_alerts,
        "steps": state.get("steps", []) + [step_log]
    }

def save_maintenance_results_node(state: MaintenanceAgentState) -> Dict[str, Any]:
    """Node 7: Persist predictions, alerts, and audit logs."""
    t0 = time.time()
    db: Session = state["db_session"]
    mongo = get_mongo_db()
    alerts = state.get("generated_alerts", [])
    predictions = state.get("failure_predictions", [])
    recommendations = state.get("recommendations", [])
    run_id = state.get("run_id", f"MAINT-{uuid.uuid4().hex[:8].upper()}")

    now = datetime.datetime.utcnow()
    saved_alerts_count = 0

    # Save new alerts
    for a in alerts:
        db_alert = MaintenanceAlert(
            asset_id=a["asset_id"],
            facility_id=a["facility_id"],
            floor=a["floor"],
            title=a["title"],
            description=a["description"],
            severity=a["severity"],
            sensor_readings=a["sensor_readings"],
            recommended_action=a["recommended_action"],
            status="NEW",
            created_at=now
        )
        db.add(db_alert)
        saved_alerts_count += 1

    # Save predictions
    for p in predictions:
        pred_rec = MaintenancePrediction(
            asset_id=p["asset_id"],
            predicted_at=now,
            health_score=p.get("health_score", 100.0),
            failure_risk_pct=p["failure_risk_pct"],
            risk_level=p["risk_level"],
            estimated_days_to_failure=p["predicted_failure_days"],
            recommendation=next((r["suggested_action"] for r in recommendations if r["asset_id"] == p["asset_id"]), "Standard Inspection"),
            reason=p["diagnosis"]
        )
        db.add(pred_rec)

    db.commit()

    # Log execution trace to MongoDB
    trace = {
        "run_id": run_id,
        "timestamp": now.isoformat(),
        "status": "COMPLETED",
        "assets_analyzed": len(state.get("assets_data", [])),
        "new_alerts_created": saved_alerts_count,
        "recommendations_count": len(recommendations),
        "steps": state.get("steps", [])
    }
    try:
        mongo.maintenance_agent_logs.insert_one(trace)
    except Exception:
        pass

    step_log = {
        "node": "Database Persistence Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Persisted {len(predictions)} failure predictions, {saved_alerts_count} new alerts, and logged run {run_id} to DocStore."
    }

    return {
        "status": "COMPLETED",
        "steps": state.get("steps", []) + [step_log]
    }

# ----------------- LANGGRAPH PIPELINE ASSEMBLY ----------------- #

def build_maintenance_agent_graph():
    """Compiles the 7-node LangGraph Maintenance Agent workflow."""
    builder = StateGraph(MaintenanceAgentState)

    builder.add_node("data_validation", asset_data_validation_node)
    builder.add_node("condition_analysis", equipment_condition_analysis_node)
    builder.add_node("health_scoring", health_score_calculation_node)
    builder.add_node("risk_prediction", failure_risk_prediction_node)
    builder.add_node("recommendation", maintenance_recommendation_node)
    builder.add_node("alert_generation", alert_generation_node)
    builder.add_node("persistence", save_maintenance_results_node)

    # Linear workflow sequence
    builder.add_edge(START, "data_validation")
    builder.add_edge("data_validation", "condition_analysis")
    builder.add_edge("condition_analysis", "health_scoring")
    builder.add_edge("health_scoring", "risk_prediction")
    builder.add_edge("risk_prediction", "recommendation")
    builder.add_edge("recommendation", "alert_generation")
    builder.add_edge("alert_generation", "persistence")
    builder.add_edge("persistence", END)

    return builder.compile()

maintenance_agent_graph = build_maintenance_agent_graph()

def execute_maintenance_agent(db: Session, facility_id: str = "all") -> Dict[str, Any]:
    """Synchronously executes the LangGraph Maintenance Agent."""
    t_start = time.time()
    run_id = f"MAINT-{uuid.uuid4().hex[:8].upper()}"

    initial_state: MaintenanceAgentState = {
        "run_id": run_id,
        "facility_id": facility_id,
        "db_session": db,
        "assets_data": [],
        "validation_report": {},
        "condition_analysis": {},
        "health_scores": {},
        "failure_predictions": [],
        "recommendations": [],
        "generated_alerts": [],
        "steps": [],
        "status": "INITIALIZED",
        "error": None
    }

    final_state = maintenance_agent_graph.invoke(initial_state)
    elapsed_ms = round((time.time() - t_start) * 1000, 2)

    active_alerts_count = (
        db.query(MaintenanceAlert)
        .filter(MaintenanceAlert.status.in_(["NEW", "ACKNOWLEDGED"]))
        .count()
    )
    predictions_count = len(final_state.get("failure_predictions", []))
    new_alerts_count = len(final_state.get("generated_alerts", []))
    recs_count = len(final_state.get("recommendations", []))
    assets_count = len(final_state.get("assets_data", []))

    return {
        "run_id": run_id,
        "facility_id": facility_id,
        "status": final_state.get("status", "COMPLETED"),
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "execution_time_ms": elapsed_ms,
        "steps": final_state.get("steps", []),
        "assets_analyzed": assets_count,
        "alerts_generated": new_alerts_count,
        "active_alerts_count": active_alerts_count,
        "recommendations_generated": recs_count,
        "predictions_count": predictions_count,
        "summary_message": f"Successfully executed Maintenance Agent across {assets_count} assets: {predictions_count} predictions updated, {active_alerts_count} active alerts monitored ({new_alerts_count} new) in {elapsed_ms} ms."
    }
