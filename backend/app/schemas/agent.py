from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class AgentRunRequest(BaseModel):
    facility_id: Optional[str] = "all"
    lookback_days: Optional[int] = 7
    sensitivity: Optional[float] = 0.1  # Isolation Forest contamination / sensitivity

class AgentStepLog(BaseModel):
    node: str
    status: str
    duration_ms: float
    summary: str
    metadata: Optional[Dict[str, Any]] = None

class AgentRunResponse(BaseModel):
    run_id: str
    facility_id: str
    status: str
    timestamp: str
    execution_time_ms: float
    steps: List[AgentStepLog]
    records_analyzed: int
    anomalies_detected: int
    recommendations_generated: int
    summary_message: str

class AgentLogHistoryItem(BaseModel):
    run_id: str
    facility_id: str
    status: str
    timestamp: str
    execution_time_ms: float
    records_analyzed: int
    anomalies_detected: int
    recommendations_generated: int
    summary: str
