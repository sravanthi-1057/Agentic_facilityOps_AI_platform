from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.database.mongodb import get_mongo_db
from app.agents.energy_agent import execute_energy_agent
from app.schemas.agent import AgentRunRequest, AgentRunResponse, AgentLogHistoryItem

router = APIRouter(prefix="/energy", tags=["LangGraph Energy Agent"])

@router.post("/analyze", response_model=AgentRunResponse)
def trigger_energy_agent(
    payload: AgentRunRequest = AgentRunRequest(),
    db: Session = Depends(get_db)
):
    """
    Executes the 5-node LangGraph Energy Agent workflow:
    Validation -> Analysis -> Anomaly Detection -> Recommendation Generation -> Save Results.
    """
    result = execute_energy_agent(
        db=db,
        facility_id=payload.facility_id or "all",
        lookback_days=payload.lookback_days or 14
    )
    return result

@router.get("/agent-logs", response_model=List[AgentLogHistoryItem])
def get_agent_execution_logs(limit: int = 20):
    """Retrieves execution traces and step audits for previous LangGraph Energy Agent runs."""
    mongo = get_mongo_db()
    logs = mongo.energy_agent_logs.find(limit=limit)

    results = []
    for log in logs:
        results.append({
            "run_id": log.get("run_id", "UNKNOWN"),
            "facility_id": log.get("facility_id", "all"),
            "status": log.get("status", "COMPLETED"),
            "timestamp": log.get("timestamp", ""),
            "execution_time_ms": float(log.get("execution_time_ms", 120.0)),
            "records_analyzed": int(log.get("records_analyzed", 0)),
            "anomalies_detected": int(log.get("anomalies_detected", 0)),
            "recommendations_generated": int(log.get("recommendations_generated", 0)),
            "summary": f"Analyzed {log.get('records_analyzed', 0)} records. Flagged {log.get('anomalies_detected', 0)} anomalies."
        })

    return results
