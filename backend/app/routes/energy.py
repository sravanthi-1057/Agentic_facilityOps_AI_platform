import io
import datetime
import pandas as pd
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db, EnergyAlert, EnergyRecommendation, EnergyMeter, EnergyUsage, Facility
from app.config import settings
from app.analytics.engine import EnergyAnalyticsEngine
from app.services.data_validator import DataValidator
from app.services.iot_simulator import simulator
from app.services.anomaly_detector import anomaly_detector
from app.schemas.energy import (
    EnergySummary,
    EnergyDistributionResponse,
    AnomalyItem,
    RecommendationItem,
    IngestionResult
)

router = APIRouter(prefix="/energy", tags=["Energy Telemetry & Analytics"])

@router.get("/summary", response_model=EnergySummary)
def get_energy_summary(
    facility_id: Optional[str] = Query("all", description="Facility ID or 'all'"),
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """Retrieves top-level facility KPI cards data calculated from database telemetry."""
    analytics = EnergyAnalyticsEngine(db)
    df = analytics.get_dataframe(facility_id=facility_id, days=days)
    kpis = analytics.compute_kpis(df)
    return kpis

@router.get("/consumption")
def get_energy_consumption(
    facility_id: Optional[str] = Query("all"),
    floor: Optional[str] = Query("all"),
    interval: str = Query("hourly", pattern="^(hourly|daily|weekly)$"),
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """Retrieves time-series energy consumption aggregated by hourly, daily, or weekly intervals."""
    analytics = EnergyAnalyticsEngine(db)
    df = analytics.get_dataframe(facility_id=facility_id, days=days)

    if not df.empty and floor and floor.lower() != "all":
        df = df[df["floor"] == floor]

    freq_map = {"hourly": "1h", "daily": "1D", "weekly": "1W"}
    freq = freq_map.get(interval, "1h")

    # Limit hourly queries to last 7 days for responsive chart rendering if 30 days requested
    if interval == "hourly" and days > 7:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=7)
        df_hourly = df[df["timestamp"] >= cutoff]
        timeseries = analytics.compute_timeseries(df_hourly, freq=freq)
    else:
        timeseries = analytics.compute_timeseries(df, freq=freq)

    return {
        "facility_id": facility_id,
        "floor": floor,
        "interval": interval,
        "points_count": len(timeseries),
        "data": timeseries
    }

@router.get("/distribution", response_model=EnergyDistributionResponse)
def get_energy_distribution(
    facility_id: Optional[str] = Query("all"),
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """Retrieves subsystem energy distribution (HVAC, Lighting, Equipment, Other) and floor-wise comparisons."""
    analytics = EnergyAnalyticsEngine(db)
    df = analytics.get_dataframe(facility_id=facility_id, days=days)
    dist = analytics.compute_distribution(df)
    return dist

@router.get("/anomalies", response_model=List[AnomalyItem])
def get_anomalies(
    facility_id: Optional[str] = Query("all"),
    severity: Optional[str] = Query("all"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Lists detected anomalies with severity, actual vs expected usage, deviation %, and explanations."""
    query = (
        db.query(EnergyAlert, EnergyMeter.floor)
        .join(EnergyMeter, EnergyAlert.meter_id == EnergyMeter.meter_id)
        .order_by(desc(EnergyAlert.created_at))
    )

    if facility_id and facility_id.lower() != "all":
        query = query.filter(EnergyAlert.facility_id == facility_id)

    if severity and severity.lower() != "all":
        query = query.filter(EnergyAlert.severity == severity.capitalize())

    alerts = query.limit(limit).all()

    results = []
    for alert, floor in alerts:
        res = alert.to_dict()
        res["floor"] = floor
        res["timestamp"] = res["created_at"]
        res["explanation"] = alert.description
        results.append(res)

    return results

@router.get("/recommendations", response_model=List[RecommendationItem])
def get_recommendations(
    priority: Optional[str] = Query("all"),
    status: Optional[str] = Query("all"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves AI-generated energy saving recommendations with quantifiable kWh and cost savings."""
    query = db.query(EnergyRecommendation).order_by(desc(EnergyRecommendation.created_at))

    if priority and priority.lower() != "all":
        query = query.filter(EnergyRecommendation.priority == priority.capitalize())

    if status and status.lower() != "all":
        query = query.filter(EnergyRecommendation.status == status)

    recs = query.limit(limit).all()

    results = []
    for r in recs:
        # Split action if formatted with hyphens
        parts = r.recommendation.split(" - ")
        title = parts[0]
        action = parts[1] if len(parts) > 1 else "Implement scheduled setback."

        results.append({
            "recommendation_id": r.recommendation_id,
            "alert_id": r.alert_id,
            "title": title,
            "description": f"Targeted optimization for building efficiency. Expected saving: {r.estimated_energy_savings:.1f} kWh/month.",
            "reason": f"Historical telemetry deviated from target benchmark, leading to excess utility expenditures.",
            "facility_id": "FAC-001",
            "floor": "Active Floors",
            "priority": r.priority,
            "estimated_energy_savings_kwh": r.estimated_energy_savings,
            "estimated_cost_savings_usd": r.estimated_cost_savings,
            "suggested_action": action,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else ""
        })

    return results

@router.get("/forecast")
def get_energy_forecast(
    facility_id: Optional[str] = Query("all"),
    days_ahead: int = Query(7, ge=1, le=14),
    db: Session = Depends(get_db)
):
    """Provides baseline forecast vs actual consumption comparisons."""
    analytics = EnergyAnalyticsEngine(db)
    df = analytics.get_dataframe(facility_id=facility_id, days=14)

    if df.empty:
        return {"forecast": []}

    # Hourly baseline profile by hour of day
    df_copy = df.copy()
    df_copy["hour"] = df_copy["timestamp"].dt.hour
    hourly_baseline = df_copy.groupby("hour")["electricity_usage"].mean().to_dict()
    hourly_std = df_copy.groupby("hour")["electricity_usage"].std().to_dict()

    forecast_points = []
    latest_time = df["timestamp"].max()

    for h in range(1, 48):  # Next 48 hours forecast
        future_time = latest_time + datetime.timedelta(hours=h)
        hr = future_time.hour
        is_weekend = future_time.weekday() >= 5
        scale = 0.4 if is_weekend else 1.0

        base = hourly_baseline.get(hr, 25.0) * scale
        std = hourly_std.get(hr, 5.0)

        forecast_points.append({
            "timestamp": future_time.strftime("%Y-%m-%d %H:%M"),
            "baseline_expected": round(base, 2),
            "upper_bound": round(base + (1.96 * std), 2),
            "lower_bound": round(max(5.0, base - (1.96 * std)), 2)
        })

    return {
        "facility_id": facility_id,
        "hours_ahead": len(forecast_points),
        "forecast": forecast_points
    }

@router.post("/upload", response_model=IngestionResult)
async def upload_energy_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Ingests and validates CSV energy telemetry files.
    Deduplicates, sanitizes, and persists to SQL & MongoDB.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        validated_df, report = DataValidator.validate_dataframe(df)
        ingest_res = DataValidator.ingest_to_databases(validated_df, db)

        # Quick anomaly scan on ingested batch
        detected_anomalies = anomaly_detector.detect_anomalies(validated_df)

        return {
            "status": "SUCCESS",
            "filename": file.filename,
            "total_rows_processed": report["total_rows"],
            "valid_rows_inserted": ingest_res["sql_rows_inserted"],
            "duplicate_rows_skipped": report["duplicate_rows"],
            "invalid_rows_rejected": report["invalid_rows_dropped"],
            "anomalies_detected": len(detected_anomalies),
            "details": report["details"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")

@router.post("/seed")
def seed_simulated_data(days: int = Query(35, ge=7, le=60), db: Session = Depends(get_db)):
    """
    Simulates smart building IoT historical records (30+ days) and seeds the databases.
    """
    # 1. Generate facilities & meters
    facilities, meters = simulator.generate_meter_catalog()

    for f in facilities:
        if not db.query(Facility).filter(Facility.facility_id == f["facility_id"]).first():
            db.add(Facility(**f))
    db.commit()

    for m in meters:
        if not db.query(EnergyMeter).filter(EnergyMeter.meter_id == m["meter_id"]).first():
            db.add(EnergyMeter(**m))
    db.commit()

    # 2. Generate timeseries data
    df = simulator.generate_timeseries(days=days)

    # Export to data/energy_data.csv
    csv_path = simulator.export_csv(settings.DATA_DIR / "energy_data.csv", days=days)

    # 3. Ingest into SQL & MongoDB
    validated_df, report = DataValidator.validate_dataframe(df)
    ingest_res = DataValidator.ingest_to_databases(validated_df, db)

    # 4. Train anomaly detector and evaluate model
    eval_metrics = anomaly_detector.fit_and_evaluate(validated_df)

    # 5. Extract initial anomalies and persist alerts & recommendations
    anomalies = anomaly_detector.detect_anomalies(validated_df)
    for a in anomalies[:15]:
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
    db.commit()

    return {
        "status": "SEEDED_SUCCESSFULLY",
        "days_simulated": days,
        "facilities_created": len(facilities),
        "meters_created": len(meters),
        "total_records_inserted": ingest_res["sql_rows_inserted"],
        "csv_path": str(csv_path),
        "anomaly_evaluation": eval_metrics
    }
