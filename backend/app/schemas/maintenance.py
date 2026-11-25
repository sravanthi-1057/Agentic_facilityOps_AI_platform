from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AssetSchema(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: str
    facility_id: str
    floor: str
    installation_date: Optional[str] = None
    last_maintenance_date: Optional[str] = None
    next_scheduled_maintenance: Optional[str] = None
    operational_status: str
    temperature: float
    vibration: float
    pressure: float
    power_consumption: float
    runtime_hours: float
    asset_age_years: float
    health_score: float
    failure_risk_pct: float
    maintenance_priority: str
    predicted_failure_days: int
    notes: Optional[str] = None

class SensorReadingSchema(BaseModel):
    reading_id: int
    asset_id: str
    timestamp: str
    temperature: float
    vibration: float
    pressure: float
    power_consumption: float
    runtime_hours: float

class HealthHistoryPointSchema(BaseModel):
    history_id: int
    asset_id: str
    timestamp: str
    health_score: float
    failure_risk_pct: float
    contributing_factors: Optional[str] = None

class MaintenanceAlertSchema(BaseModel):
    alert_id: int
    id: Optional[int] = None
    asset_id: str
    asset_name: Optional[str] = None
    asset_type: Optional[str] = None
    facility_id: str
    floor: str
    title: str
    description: str
    severity: str
    sensor_readings: Optional[str] = None
    recommended_action: str
    status: str
    created_at: str
    resolved_at: Optional[str] = None

class MaintenanceScheduleSchema(BaseModel):
    schedule_id: int
    id: Optional[int] = None
    work_order_id: Optional[str] = None
    asset_id: str
    asset_name: Optional[str] = None
    facility_id: Optional[str] = None
    floor: Optional[str] = None
    title: str
    description: str
    scheduled_date: str
    priority: str
    assigned_technician: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    notes: Optional[str] = None

class CreateScheduleRequest(BaseModel):
    asset_id: str
    title: str
    description: str
    scheduled_date: str
    priority: str = "Medium"
    assigned_technician: str
    notes: Optional[str] = None

class UpdateScheduleRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[str] = None
    priority: Optional[str] = None
    assigned_technician: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class CompleteScheduleRequest(BaseModel):
    notes: Optional[str] = None

class MaintenancePredictionSchema(BaseModel):
    prediction_id: int
    id: Optional[int] = None
    asset_id: str
    asset_name: Optional[str] = None
    asset_type: Optional[str] = None
    facility_id: Optional[str] = None
    floor: Optional[str] = None
    predicted_at: str
    health_score: float
    failure_risk_pct: float
    risk_level: str
    estimated_days_to_failure: int
    recommendation: str
    reason: str
    anomalous_features: Optional[str] = None

class AssetDetailResponse(AssetSchema):
    nominal_spec: Optional[Dict[str, Any]] = None
    contributing_factors: Optional[Dict[str, Any]] = None
    sensor_history: Optional[List[Dict[str, Any]]] = None
    health_history: Optional[List[Dict[str, Any]]] = None
    alerts: Optional[List[Dict[str, Any]]] = None
    schedules: Optional[List[Dict[str, Any]]] = None
    latest_prediction: Optional[Dict[str, Any]] = None

class HealthCategoryCount(BaseModel):
    category: str
    count: int
    color: str

class AssetTypeCount(BaseModel):
    type: str
    count: int

class RiskLevelCount(BaseModel):
    level: str
    count: int
    color: str

class MaintenanceKPIsResponse(BaseModel):
    total_assets_count: int
    healthy_assets_count: int
    warning_assets_count: int
    poor_assets_count: int
    critical_assets_count: int
    predicted_failures_count: int
    open_alerts_count: int
    critical_alerts_count: int
    scheduled_tasks_count: int
    overdue_tasks_count: int
    completed_tasks_count: int
    avg_fleet_health_score: float
    health_distribution: List[HealthCategoryCount]
    asset_type_distribution: List[AssetTypeCount]
    failure_risk_distribution: List[RiskLevelCount]

class MaintenanceAgentStepLog(BaseModel):
    node: str
    status: str
    duration_ms: float
    summary: str
    metadata: Optional[Dict[str, Any]] = None

class MaintenanceAgentRunResponse(BaseModel):
    run_id: str
    facility_id: str
    status: str
    timestamp: str
    execution_time_ms: float
    steps: List[MaintenanceAgentStepLog]
    assets_analyzed: int
    alerts_generated: int
    active_alerts_count: Optional[int] = 0
    recommendations_generated: int
    predictions_count: Optional[int] = 0
    summary_message: str
