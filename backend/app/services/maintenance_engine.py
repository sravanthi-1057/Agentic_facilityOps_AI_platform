import datetime
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database.models import (
    Asset,
    AssetSensorReading,
    AssetHealthHistory,
    MaintenanceAlert,
    MaintenanceSchedule,
    MaintenancePrediction,
    Facility
)
from app.services.asset_simulator import asset_simulator

class MaintenanceEngine:
    """
    Analytics, Health Scoring & Work Order Engine for Facility Asset Operations.
    """

    @staticmethod
    def get_kpis(db: Session, facility_id: Optional[str] = "all") -> Dict[str, Any]:
        """Calculates fleet-wide asset health, risk distribution, and work order KPIs."""
        query = db.query(Asset)
        if facility_id and facility_id.lower() != "all":
            query = query.filter(Asset.facility_id == facility_id)

        assets = query.all()
        if not assets:
            # Seed if empty
            asset_simulator.seed_initial_assets(db)
            query = db.query(Asset)
            if facility_id and facility_id.lower() != "all":
                query = query.filter(Asset.facility_id == facility_id)
            assets = query.all()

        total = len(assets)
        if total == 0:
            return {}

        healthy = sum(1 for a in assets if a.health_score >= 75)
        warning = sum(1 for a in assets if 60 <= a.health_score < 75)
        poor = sum(1 for a in assets if 40 <= a.health_score < 60)
        critical = sum(1 for a in assets if a.health_score < 40)
        predicted_failures = sum(1 for a in assets if a.failure_risk_pct >= 50 or a.predicted_failure_days <= 14)

        avg_health = round(sum(a.health_score for a in assets) / total, 1)

        # Alerts summary
        alert_query = db.query(MaintenanceAlert)
        if facility_id and facility_id.lower() != "all":
            alert_query = alert_query.filter(MaintenanceAlert.facility_id == facility_id)

        open_alerts = alert_query.filter(MaintenanceAlert.status.in_(["NEW", "ACKNOWLEDGED"])).count()
        critical_alerts = alert_query.filter(
            MaintenanceAlert.status.in_(["NEW", "ACKNOWLEDGED"]),
            MaintenanceAlert.severity == "Critical"
        ).count()

        # Schedules summary
        schedule_query = db.query(MaintenanceSchedule)
        if facility_id and facility_id.lower() != "all":
            schedule_query = schedule_query.join(Asset, MaintenanceSchedule.asset_id == Asset.asset_id).filter(Asset.facility_id == facility_id)

        scheduled_tasks = schedule_query.filter(MaintenanceSchedule.status.in_(["SCHEDULED", "IN_PROGRESS"])).count()
        overdue_tasks = schedule_query.filter(MaintenanceSchedule.status == "OVERDUE").count()
        completed_tasks = schedule_query.filter(MaintenanceSchedule.status == "COMPLETED").count()

        # Health distribution buckets
        health_dist = [
            {"category": "Excellent (90-100)", "count": sum(1 for a in assets if a.health_score >= 90), "color": "#10b981"},
            {"category": "Good (75-89)", "count": sum(1 for a in assets if 75 <= a.health_score < 90), "color": "#34d399"},
            {"category": "Warning (60-74)", "count": warning, "color": "#f59e0b"},
            {"category": "Poor (40-59)", "count": poor, "color": "#f97316"},
            {"category": "Critical (0-39)", "count": critical, "color": "#ef4444"}
        ]

        # Asset Type breakdown
        type_counts: Dict[str, int] = {}
        for a in assets:
            type_counts[a.asset_type] = type_counts.get(a.asset_type, 0) + 1

        type_dist = [
            {"type": k, "count": v}
            for k, v in sorted(type_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        # Failure Risk distribution
        risk_dist = [
            {"level": "Low (<15%)", "count": sum(1 for a in assets if a.failure_risk_pct < 15), "color": "#10b981"},
            {"level": "Medium (15-34%)", "count": sum(1 for a in assets if 15 <= a.failure_risk_pct < 35), "color": "#3b82f6"},
            {"level": "High (35-69%)", "count": sum(1 for a in assets if 35 <= a.failure_risk_pct < 70), "color": "#f59e0b"},
            {"level": "Critical (≥70%)", "count": sum(1 for a in assets if a.failure_risk_pct >= 70), "color": "#ef4444"}
        ]

        return {
            "total_assets_count": total,
            "healthy_assets_count": healthy,
            "warning_assets_count": warning,
            "poor_assets_count": poor,
            "critical_assets_count": critical,
            "predicted_failures_count": predicted_failures,
            "open_alerts_count": open_alerts,
            "critical_alerts_count": critical_alerts,
            "scheduled_tasks_count": scheduled_tasks,
            "overdue_tasks_count": overdue_tasks,
            "completed_tasks_count": completed_tasks,
            "avg_fleet_health_score": avg_health,
            "health_distribution": health_dist,
            "asset_type_distribution": type_dist,
            "failure_risk_distribution": risk_dist
        }

    @staticmethod
    def get_asset_detail(db: Session, asset_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves comprehensive single asset view with sensor telemetry history & work orders."""
        asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
        if not asset:
            return None

        # Calculate contributing factors breakdown
        spec = asset_simulator.ASSET_SPECIFICATIONS.get(asset.asset_type, asset_simulator.ASSET_SPECIFICATIONS["Pump"])
        days_since = (datetime.datetime.utcnow() - asset.last_maintenance_date).days if asset.last_maintenance_date else 90

        _, _, _, _, penalties = asset_simulator.calculate_health_and_risk(
            asset_type=asset.asset_type,
            temp=asset.temperature,
            vib=asset.vibration,
            pressure=asset.pressure,
            runtime_hrs=asset.runtime_hours,
            days_since_maint=days_since,
            age_years=asset.asset_age_years
        )

        # Recent 30 sensor readings
        readings = (
            db.query(AssetSensorReading)
            .filter(AssetSensorReading.asset_id == asset_id)
            .order_by(AssetSensorReading.timestamp.asc())
            .limit(30)
            .all()
        )

        # Health history
        health_history = (
            db.query(AssetHealthHistory)
            .filter(AssetHealthHistory.asset_id == asset_id)
            .order_by(AssetHealthHistory.timestamp.asc())
            .limit(20)
            .all()
        )

        # Alerts
        alerts = (
            db.query(MaintenanceAlert)
            .filter(MaintenanceAlert.asset_id == asset_id)
            .order_by(desc(MaintenanceAlert.created_at))
            .limit(10)
            .all()
        )

        # Schedules
        schedules = (
            db.query(MaintenanceSchedule)
            .filter(MaintenanceSchedule.asset_id == asset_id)
            .order_by(desc(MaintenanceSchedule.scheduled_date))
            .limit(10)
            .all()
        )

        # Latest prediction
        pred = (
            db.query(MaintenancePrediction)
            .filter(MaintenancePrediction.asset_id == asset_id)
            .order_by(desc(MaintenancePrediction.predicted_at))
            .first()
        )

        data = asset.to_dict()
        data["nominal_spec"] = spec
        data["contributing_factors"] = penalties
        data["sensor_history"] = [r.to_dict() for r in readings]
        data["health_history"] = [h.to_dict() for h in health_history]
        data["alerts"] = [a.to_dict() for a in alerts]
        data["schedules"] = [s.to_dict() for s in schedules]
        data["latest_prediction"] = pred.to_dict() if pred else None

        return data

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: int) -> Optional[Dict[str, Any]]:
        """Acknowledges an active maintenance alert."""
        alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.alert_id == alert_id).first()
        if not alert:
            return None

        alert.status = "ACKNOWLEDGED"
        db.commit()
        return alert.to_dict()

    @staticmethod
    def resolve_alert(db: Session, alert_id: int) -> Optional[Dict[str, Any]]:
        """Resolves an alert and stamps resolution timestamp."""
        alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.alert_id == alert_id).first()
        if not alert:
            return None

        alert.status = "RESOLVED"
        alert.resolved_at = datetime.datetime.utcnow()
        db.commit()
        return alert.to_dict()

    @staticmethod
    def create_schedule(
        db: Session,
        asset_id: str,
        title: str,
        description: str,
        scheduled_date: datetime.datetime,
        priority: str,
        assigned_technician: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates a new maintenance work order."""
        schedule = MaintenanceSchedule(
            asset_id=asset_id,
            title=title,
            description=description,
            scheduled_date=scheduled_date,
            priority=priority,
            assigned_technician=assigned_technician,
            status="SCHEDULED",
            notes=notes,
            created_at=datetime.datetime.utcnow()
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return schedule.to_dict()

    @staticmethod
    def complete_schedule(db: Session, schedule_id: int, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Marks a maintenance schedule task as completed and updates asset maintenance record."""
        schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.schedule_id == schedule_id).first()
        if not schedule:
            return None

        now = datetime.datetime.utcnow()
        schedule.status = "COMPLETED"
        schedule.completed_at = now
        if notes:
            schedule.notes = f"{schedule.notes or ''} [Completed]: {notes}".strip()

        # Also update asset's last maintenance date and bump its health score
        asset = db.query(Asset).filter(Asset.asset_id == schedule.asset_id).first()
        if asset:
            asset.last_maintenance_date = now
            asset.next_scheduled_maintenance = now + datetime.timedelta(days=180)
            asset.health_score = min(100.0, asset.health_score + 20.0)
            asset.failure_risk_pct = max(5.0, asset.failure_risk_pct - 25.0)
            if asset.health_score >= 75:
                asset.operational_status = "OPERATIONAL"
            elif asset.health_score >= 60:
                asset.operational_status = "WARNING"

        db.commit()
        db.refresh(schedule)
        return schedule.to_dict()

maintenance_engine = MaintenanceEngine()
