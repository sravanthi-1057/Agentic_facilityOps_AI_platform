import time
import uuid
import datetime
import pandas as pd
import numpy as np
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END
from sqlalchemy.orm import Session

from app.config import settings
from app.database.models import Facility, EnergyMeter, EnergyUsage, EnergyAlert, EnergyRecommendation
from app.database.mongodb import get_mongo_db
from app.analytics.engine import EnergyAnalyticsEngine
from app.services.anomaly_detector import anomaly_detector
from app.services.recommendation_engine import recommendation_engine
from app.services.data_validator import DataValidator

class EnergyAgentState(TypedDict):
    run_id: str
    facility_id: str
    lookback_days: int
    db_session: Any
    df: Optional[Any]
    validation_report: Dict[str, Any]
    analysis_summary: Dict[str, Any]
    anomalies: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    steps: List[Dict[str, Any]]
    status: str
    error: Optional[str]

# ----------------- NODE IMPLEMENTATIONS ----------------- #

def data_validation_node(state: EnergyAgentState) -> Dict[str, Any]:
    """Node 1: Validate incoming and stored energy records."""
    t0 = time.time()
    db: Session = state["db_session"]
    facility_id = state.get("facility_id", "all")
    days = state.get("lookback_days", 14)

    analytics = EnergyAnalyticsEngine(db)
    df = analytics.get_dataframe(facility_id=facility_id, days=days)

    if df.empty:
        # Fallback to load default CSV if DB has not been seeded
        data_path = settings.DATA_DIR / "energy_data.csv"
        if data_path.exists():
            df = pd.read_csv(data_path)
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            if facility_id and facility_id.lower() != "all":
                df = df[df["facility_id"] == facility_id]

    validated_df, report = DataValidator.validate_dataframe(df)

    step_log = {
        "node": "Data Validation Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Validated {len(validated_df)} sensor records across facilities.",
        "metadata": report
    }

    return {
        "df": validated_df,
        "validation_report": report,
        "steps": state.get("steps", []) + [step_log]
    }

def energy_analysis_node(state: EnergyAgentState) -> Dict[str, Any]:
    """Node 2: Calculate operational metrics and consumption profiles."""
    t0 = time.time()
    df: pd.DataFrame = state["df"]
    db: Session = state["db_session"]

    analytics = EnergyAnalyticsEngine(db)
    kpis = analytics.compute_kpis(df)
    distribution = analytics.compute_distribution(df)

    # Identify high-consumption floor
    floor_totals = df.groupby("floor")["electricity_usage"].sum().to_dict() if not df.empty else {}
    top_floor = max(floor_totals, key=floor_totals.get) if floor_totals else "None"

    analysis_summary = {
        "kpis": kpis,
        "distribution": distribution,
        "top_consuming_floor": top_floor,
        "total_floors_monitored": len(floor_totals)
    }

    step_log = {
        "node": "Energy Analysis Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Calculated KPIs: Total {kpis.get('total_electricity_kwh', 0)} kWh, Efficiency Score: {kpis.get('energy_efficiency_score', 0)}/100.",
        "metadata": {"top_floor": top_floor}
    }

    return {
        "analysis_summary": analysis_summary,
        "steps": state.get("steps", []) + [step_log]
    }

def anomaly_detection_node(state: EnergyAgentState) -> Dict[str, Any]:
    """Node 3: Run Isolation Forest inference & severity classification."""
    t0 = time.time()
    df: pd.DataFrame = state["df"]

    anomalies = anomaly_detector.detect_anomalies(df)

    # Classify summary counts
    sev_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for a in anomalies:
        s = a.get("severity", "Low")
        sev_counts[s] = sev_counts.get(s, 0) + 1

    step_log = {
        "node": "Anomaly Detection Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Detected {len(anomalies)} anomalies (Critical: {sev_counts['Critical']}, High: {sev_counts['High']}, Medium: {sev_counts['Medium']}).",
        "metadata": sev_counts
    }

    return {
        "anomalies": anomalies,
        "steps": state.get("steps", []) + [step_log]
    }

def recommendation_generation_node(state: EnergyAgentState) -> Dict[str, Any]:
    """Node 4: Rule-based & contextual energy efficiency recommendations."""
    t0 = time.time()
    anomalies = state.get("anomalies", [])

    recommendations = recommendation_engine.generate_recommendations_from_anomalies(anomalies)

    total_est_savings_kwh = sum(r["estimated_energy_savings_kwh"] for r in recommendations)
    total_est_savings_usd = sum(r["estimated_cost_savings_usd"] for r in recommendations)

    step_log = {
        "node": "Recommendation Generation Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Generated {len(recommendations)} actionable recommendations. Potential savings: {total_est_savings_kwh:.1f} kWh (${total_est_savings_usd:.2f}).",
        "metadata": {
            "count": len(recommendations),
            "savings_kwh": total_est_savings_kwh,
            "savings_usd": total_est_savings_usd
        }
    }

    return {
        "recommendations": recommendations,
        "steps": state.get("steps", []) + [step_log]
    }

def save_results_node(state: EnergyAgentState) -> Dict[str, Any]:
    """Node 5: Persist alerts & recommendations in SQL, execution log in MongoDB."""
    t0 = time.time()
    db: Session = state["db_session"]
    mongo = get_mongo_db()
    anomalies = state.get("anomalies", [])
    recommendations = state.get("recommendations", [])
    run_id = state.get("run_id", str(uuid.uuid4()))

    saved_alert_count = 0
    saved_rec_count = 0

    try:
        # Save latest anomalies to SQL
        for a in anomalies[:20]:  # limit recent batch to top 20 alerts
            alert = EnergyAlert(
                facility_id=a["facility_id"],
                meter_id=a["meter_id"],
                severity=a["severity"],
                description=f"{a['description']}: {a['explanation']}"[:250],
                actual_consumption=float(a["actual_consumption"]),
                expected_consumption=float(a["expected_consumption"]),
                created_at=datetime.datetime.utcnow()
            )
            db.add(alert)
            db.flush()
            saved_alert_count += 1

            # Match recommendation to alert if applicable
            for r in recommendations:
                if r.get("facility_id") == a["facility_id"] and r.get("floor") == a["floor"]:
                    rec = EnergyRecommendation(
                        alert_id=alert.alert_id,
                        recommendation=f"{r['title']} - {r['suggested_action']}"[:250],
                        priority=r["priority"],
                        estimated_energy_savings=float(r["estimated_energy_savings_kwh"]),
                        estimated_cost_savings=float(r["estimated_cost_savings_usd"]),
                        status="Pending",
                        created_at=datetime.datetime.utcnow()
                    )
                    db.add(rec)
                    saved_rec_count += 1

        db.commit()

        # Save general recommendations if no alert match
        if saved_rec_count == 0 and recommendations:
            for r in recommendations:
                rec = EnergyRecommendation(
                    alert_id=None,
                    recommendation=f"{r['title']} - {r['suggested_action']}"[:250],
                    priority=r["priority"],
                    estimated_energy_savings=float(r["estimated_energy_savings_kwh"]),
                    estimated_cost_savings=float(r["estimated_cost_savings_usd"]),
                    status="Pending",
                    created_at=datetime.datetime.utcnow()
                )
                db.add(rec)
                saved_rec_count += 1
            db.commit()

    except Exception as e:
        db.rollback()

    # Log execution trace into MongoDB energy_agent_logs
    agent_trace = {
        "run_id": run_id,
        "facility_id": state.get("facility_id", "all"),
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "status": "COMPLETED",
        "records_analyzed": len(state.get("df", [])),
        "anomalies_detected": len(anomalies),
        "recommendations_generated": len(recommendations),
        "steps": state.get("steps", []),
        "saved_alerts": saved_alert_count,
        "saved_recommendations": saved_rec_count
    }

    try:
        mongo.energy_agent_logs.insert_one(agent_trace)
    except Exception:
        pass

    step_log = {
        "node": "Save Results Node",
        "status": "SUCCESS",
        "duration_ms": round((time.time() - t0) * 1000, 2),
        "summary": f"Saved {saved_alert_count} alerts, {saved_rec_count} recommendations, and logged run {run_id} to MongoDB."
    }

    return {
        "status": "COMPLETED",
        "steps": state.get("steps", []) + [step_log]
    }

# ----------------- LANGGRAPH WORKFLOW ASSEMBLY ----------------- #

def build_energy_agent_graph():
    """Compiles the 5-node LangGraph Energy Agent workflow."""
    builder = StateGraph(EnergyAgentState)

    # Add Nodes
    builder.add_node("data_validation", data_validation_node)
    builder.add_node("energy_analysis", energy_analysis_node)
    builder.add_node("anomaly_detection", anomaly_detection_node)
    builder.add_node("recommendation_generation", recommendation_generation_node)
    builder.add_node("save_results", save_results_node)

    # Add Linear Workflow Edges
    builder.add_edge(START, "data_validation")
    builder.add_edge("data_validation", "energy_analysis")
    builder.add_edge("energy_analysis", "anomaly_detection")
    builder.add_edge("anomaly_detection", "recommendation_generation")
    builder.add_edge("recommendation_generation", "save_results")
    builder.add_edge("save_results", END)

    return builder.compile()

# Global compiled agent
energy_agent_graph = build_energy_agent_graph()

def execute_energy_agent(db: Session, facility_id: str = "all", lookback_days: int = 14) -> Dict[str, Any]:
    """Executes the LangGraph Energy Agent workflow synchronously."""
    t_start = time.time()
    run_id = f"RUN-{uuid.uuid4().hex[:8].upper()}"

    initial_state: EnergyAgentState = {
        "run_id": run_id,
        "facility_id": facility_id,
        "lookback_days": lookback_days,
        "db_session": db,
        "df": None,
        "validation_report": {},
        "analysis_summary": {},
        "anomalies": [],
        "recommendations": [],
        "steps": [],
        "status": "INITIALIZED",
        "error": None
    }

    final_state = energy_agent_graph.invoke(initial_state)
    elapsed_ms = round((time.time() - t_start) * 1000, 2)

    return {
        "run_id": run_id,
        "facility_id": facility_id,
        "status": final_state.get("status", "COMPLETED"),
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "execution_time_ms": elapsed_ms,
        "steps": final_state.get("steps", []),
        "records_analyzed": len(final_state.get("df", [])) if final_state.get("df") is not None else 0,
        "anomalies_detected": len(final_state.get("anomalies", [])),
        "recommendations_generated": len(final_state.get("recommendations", [])),
        "summary_message": f"Successfully completed LangGraph Energy Agent workflow in {elapsed_ms} ms."
    }
