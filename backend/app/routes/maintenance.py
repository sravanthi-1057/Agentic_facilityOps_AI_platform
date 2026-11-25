import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, Path
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.database import get_db, Asset, MaintenanceAlert, MaintenanceSchedule, MaintenancePrediction, AssetSensorReading
from app.services.asset_simulator import asset_simulator
from app.services.maintenance_engine import maintenance_engine
from app.agents.maintenance_agent import execute_maintenance_agent
from app.database.mongodb import get_mongo_db
from app.schemas.maintenance import (
    AssetSchema,
    AssetDetailResponse,
    MaintenanceAlertSchema,
    MaintenanceScheduleSchema,
    CreateScheduleRequest,
    UpdateScheduleRequest,
    CompleteScheduleRequest,
    MaintenancePredictionSchema,
    MaintenanceKPIsResponse,
    MaintenanceAgentRunResponse
)

router = APIRouter(prefix="/maintenance", tags=["Predictive Maintenance & Asset Operations"])

@router.get("/kpis", response_model=MaintenanceKPIsResponse)
def get_maintenance_kpis(
    facility_id: Optional[str] = Query("all", description="Facility ID filter or 'all'"),
    db: Session = Depends(get_db)
):
    """Retrieves top-level predictive maintenance KPI statistics and distribution breakdowns."""
    kpis = maintenance_engine.get_kpis(db, facility_id=facility_id)
    return kpis

@router.get("/assets", response_model=List[AssetSchema])
def list_assets(
    facility_id: Optional[str] = Query("all"),
    floor: Optional[str] = Query("all"),
    asset_type: Optional[str] = Query("all"),
    status: Optional[str] = Query("all"),
    min_health: Optional[float] = Query(None),
    max_health: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("health_score", pattern="^(health_score|failure_risk_pct|asset_name|temperature|vibration)$"),
    sort_order: Optional[str] = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """Lists all monitored assets with comprehensive search, filtering, and sorting."""
    # Ensure assets are seeded
    if db.query(Asset).count() == 0:
        asset_simulator.seed_initial_assets(db)

    query = db.query(Asset)

    if facility_id and facility_id.lower() != "all":
        query = query.filter(Asset.facility_id == facility_id)

    if floor and floor.lower() != "all":
        query = query.filter(Asset.floor == floor)

    if asset_type and asset_type.lower() != "all":
        query = query.filter(Asset.asset_type == asset_type)

    if status and status.lower() != "all":
        query = query.filter(Asset.operational_status == status.upper())

    if min_health is not None:
        query = query.filter(Asset.health_score >= min_health)

    if max_health is not None:
        query = query.filter(Asset.health_score <= max_health)

    # Sorting
    sort_column = getattr(Asset, sort_by, Asset.health_score)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    assets = query.all()
    return [a.to_dict() for a in assets]

@router.get("/assets/{asset_id}", response_model=AssetDetailResponse)
def get_asset_detail(
    asset_id: str = Path(..., description="Unique Asset ID (e.g. AST-CHL-001)"),
    db: Session = Depends(get_db)
):
    """Retrieves full telemetry history, health breakdown, work orders, and predictions for a single asset."""
    detail = maintenance_engine.get_asset_detail(db, asset_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found.")
    return detail

@router.get("/assets/{asset_id}/readings")
def get_asset_readings(
    asset_id: str = Path(...),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Returns historical sensor readings time-series for an asset."""
    readings = (
        db.query(AssetSensorReading)
        .filter(AssetSensorReading.asset_id == asset_id)
        .order_by(AssetSensorReading.timestamp.asc())
        .limit(limit)
        .all()
    )
    return [r.to_dict() for r in readings]

@router.get("/predictions", response_model=List[MaintenancePredictionSchema])
def get_maintenance_predictions(
    facility_id: Optional[str] = Query("all"),
    risk_level: Optional[str] = Query("all"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Lists predictive failure risk estimates, remaining useful life (RUL), and recommended actions."""
    # Ensure assets are seeded
    if db.query(Asset).count() == 0:
        asset_simulator.seed_initial_assets(db)

    query = (
        db.query(MaintenancePrediction)
        .join(Asset, MaintenancePrediction.asset_id == Asset.asset_id)
        .order_by(desc(MaintenancePrediction.predicted_at), desc(MaintenancePrediction.prediction_id))
    )

    if facility_id and facility_id.lower() != "all":
        query = query.filter(Asset.facility_id == facility_id)

    if risk_level and risk_level.lower() != "all":
        query = query.filter(MaintenancePrediction.risk_level.ilike(risk_level))

    preds = query.all()
    seen_assets = set()
    latest_predictions = []
    for pred in preds:
        if pred.asset_id not in seen_assets:
            seen_assets.add(pred.asset_id)
            latest_predictions.append(pred.to_dict())
            if len(latest_predictions) >= limit:
                break

    # Sort so that highest failure risks appear at the top
    latest_predictions.sort(key=lambda x: x["failure_risk_pct"], reverse=True)
    return latest_predictions

@router.get("/alerts", response_model=List[MaintenanceAlertSchema])
def list_maintenance_alerts(
    facility_id: Optional[str] = Query("all"),
    severity: Optional[str] = Query("all"),
    status: Optional[str] = Query("all"),
    asset_id: Optional[str] = Query("all"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Lists maintenance alerts with filters for severity, status, and asset."""
    # Ensure assets and alerts are seeded
    if db.query(Asset).count() == 0:
        asset_simulator.seed_initial_assets(db)

    query = db.query(MaintenanceAlert).order_by(desc(MaintenanceAlert.created_at))

    if facility_id and facility_id.lower() != "all":
        query = query.filter(MaintenanceAlert.facility_id == facility_id)

    if severity and severity.lower() != "all":
        query = query.filter(MaintenanceAlert.severity.ilike(severity))

    if status and status.lower() != "all":
        query = query.filter(MaintenanceAlert.status.ilike(status))

    if asset_id and asset_id.lower() != "all":
        query = query.filter(MaintenanceAlert.asset_id == asset_id)

    alerts = query.limit(limit).all()
    return [a.to_dict() for a in alerts]

@router.post("/alerts/{alert_id}/acknowledge", response_model=MaintenanceAlertSchema)
def acknowledge_maintenance_alert(
    alert_id: int = Path(...),
    db: Session = Depends(get_db)
):
    """Acknowledges an active maintenance alert."""
    alert = maintenance_engine.acknowledge_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert with ID {alert_id} not found.")
    return alert

@router.post("/alerts/{alert_id}/resolve", response_model=MaintenanceAlertSchema)
def resolve_maintenance_alert(
    alert_id: int = Path(...),
    db: Session = Depends(get_db)
):
    """Resolves a maintenance alert and stamps resolution timestamp."""
    alert = maintenance_engine.resolve_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert with ID {alert_id} not found.")
    return alert

@router.get("/schedules", response_model=List[MaintenanceScheduleSchema])
def list_maintenance_schedules(
    facility_id: Optional[str] = Query("all"),
    asset_id: Optional[str] = Query("all"),
    status: Optional[str] = Query("all"),
    priority: Optional[str] = Query("all"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Lists upcoming, overdue, and completed maintenance work orders."""
    # Ensure assets are seeded
    if db.query(Asset).count() == 0:
        asset_simulator.seed_initial_assets(db)

    query = (
        db.query(MaintenanceSchedule)
        .join(Asset, MaintenanceSchedule.asset_id == Asset.asset_id)
        .order_by(MaintenanceSchedule.scheduled_date.asc())
    )

    if facility_id and facility_id.lower() != "all":
        query = query.filter(Asset.facility_id == facility_id)

    if asset_id and asset_id.lower() != "all":
        query = query.filter(MaintenanceSchedule.asset_id == asset_id)

    if status and status.lower() != "all":
        query = query.filter(MaintenanceSchedule.status.ilike(status))

    if priority and priority.lower() != "all":
        query = query.filter(MaintenanceSchedule.priority.ilike(priority))

    schedules = query.limit(limit).all()
    return [s.to_dict() for s in schedules]

@router.post("/schedules", response_model=MaintenanceScheduleSchema)
def create_maintenance_schedule(
    payload: CreateScheduleRequest,
    db: Session = Depends(get_db)
):
    """Creates a new maintenance schedule or work order."""
    # Verify asset exists
    asset = db.query(Asset).filter(Asset.asset_id == payload.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{payload.asset_id}' does not exist.")

    try:
        dt = datetime.datetime.fromisoformat(payload.scheduled_date.replace("Z", "+00:00"))
    except Exception:
        dt = datetime.datetime.utcnow() + datetime.timedelta(days=7)

    schedule = maintenance_engine.create_schedule(
        db=db,
        asset_id=payload.asset_id,
        title=payload.title,
        description=payload.description,
        scheduled_date=dt,
        priority=payload.priority,
        assigned_technician=payload.assigned_technician,
        notes=payload.notes
    )
    return schedule

@router.put("/schedules/{schedule_id}", response_model=MaintenanceScheduleSchema)
def update_maintenance_schedule(
    schedule_id: int = Path(...),
    payload: UpdateScheduleRequest = UpdateScheduleRequest(),
    db: Session = Depends(get_db)
):
    """Updates an existing maintenance work order."""
    schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.schedule_id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail=f"Schedule with ID {schedule_id} not found.")

    if payload.title:
        schedule.title = payload.title
    if payload.description:
        schedule.description = payload.description
    if payload.priority:
        schedule.priority = payload.priority
    if payload.assigned_technician:
        schedule.assigned_technician = payload.assigned_technician
    if payload.status:
        schedule.status = payload.status.upper()
    if payload.notes:
        schedule.notes = payload.notes
    if payload.scheduled_date:
        try:
            schedule.scheduled_date = datetime.datetime.fromisoformat(payload.scheduled_date.replace("Z", "+00:00"))
        except Exception:
            pass

    db.commit()
    return schedule.to_dict()

@router.post("/schedules/{schedule_id}/complete", response_model=MaintenanceScheduleSchema)
def complete_maintenance_schedule(
    schedule_id: int = Path(...),
    payload: CompleteScheduleRequest = CompleteScheduleRequest(),
    db: Session = Depends(get_db)
):
    """Marks a maintenance work order complete and restores asset health score."""
    schedule = maintenance_engine.complete_schedule(db, schedule_id, notes=payload.notes)
    if not schedule:
        raise HTTPException(status_code=404, detail=f"Schedule with ID {schedule_id} not found.")
    return schedule

@router.post("/telemetry/refresh")
def refresh_asset_telemetry(db: Session = Depends(get_db)):
    """
    Simulates dynamic sensor stream updates, recomputes health scores,
    evaluates failure risks, and triggers maintenance alerts.
    """
    res = asset_simulator.refresh_sensor_readings(db)
    return res

@router.post("/analyze", response_model=MaintenanceAgentRunResponse)
def trigger_maintenance_agent(
    facility_id: Optional[str] = Query("all"),
    db: Session = Depends(get_db)
):
    """
    Executes the autonomous 7-node LangGraph Maintenance Agent workflow:
    Telemetry Validation -> Condition Analysis -> Health Scoring ->
    Failure Prediction -> Recommendations -> Alert Generation -> Persistence.
    """
    result = execute_maintenance_agent(db=db, facility_id=facility_id or "all")
    return result

@router.get("/agent-logs")
def get_maintenance_agent_logs(limit: int = Query(20, ge=1, le=100)):
    """Retrieves execution traces of the LangGraph Maintenance Agent from MongoDB/DocStore."""
    mongo = get_mongo_db()
    logs = mongo.maintenance_agent_logs.find(limit=limit)

    results = []
    for log in logs:
        results.append({
            "run_id": log.get("run_id", "UNKNOWN"),
            "status": log.get("status", "COMPLETED"),
            "timestamp": log.get("timestamp", ""),
            "assets_analyzed": int(log.get("assets_analyzed", 0)),
            "new_alerts_created": int(log.get("new_alerts_created", 0)),
            "recommendations_count": int(log.get("recommendations_count", 0)),
            "steps": log.get("steps", [])
        })
    return results
