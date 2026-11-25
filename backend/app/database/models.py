import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Facility(Base):
    __tablename__ = "facilities"

    facility_id = Column(String(50), primary_key=True, index=True)
    facility_name = Column(String(100), nullable=False)
    facility_type = Column(String(50), nullable=False)  # e.g., Commercial Office, R&D Lab
    location = Column(String(150), nullable=False)

    # Relationships
    meters = relationship("EnergyMeter", back_populates="facility", cascade="all, delete-orphan")
    alerts = relationship("EnergyAlert", back_populates="facility", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="facility", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "facility_id": self.facility_id,
            "facility_name": self.facility_name,
            "facility_type": self.facility_type,
            "location": self.location,
        }


class EnergyMeter(Base):
    __tablename__ = "energy_meters"

    meter_id = Column(String(50), primary_key=True, index=True)
    facility_id = Column(String(50), ForeignKey("facilities.facility_id", ondelete="CASCADE"), nullable=False, index=True)
    floor = Column(String(20), nullable=False, index=True)
    meter_type = Column(String(50), nullable=False)  # Main, HVAC, Lighting, Equipment
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, MAINTENANCE, OFFLINE

    # Relationships
    facility = relationship("Facility", back_populates="meters")
    usage_records = relationship("EnergyUsage", back_populates="meter", cascade="all, delete-orphan")
    alerts = relationship("EnergyAlert", back_populates="meter", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "meter_id": self.meter_id,
            "facility_id": self.facility_id,
            "floor": self.floor,
            "meter_type": self.meter_type,
            "status": self.status,
        }


class EnergyUsage(Base):
    __tablename__ = "energy_usage"

    energy_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    meter_id = Column(String(50), ForeignKey("energy_meters.meter_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    electricity_usage = Column(Float, nullable=False)  # in kWh
    water_usage = Column(Float, nullable=False)        # in Litres
    hvac_usage = Column(Float, nullable=False)         # in kWh
    lighting_usage = Column(Float, nullable=False)     # in kWh
    equipment_usage = Column(Float, nullable=False)    # in kWh
    temperature = Column(Float, nullable=False)        # in Celsius

    # Relationships
    meter = relationship("EnergyMeter", back_populates="usage_records")

    __table_args__ = (
        Index("idx_usage_meter_timestamp", "meter_id", "timestamp"),
    )

    def to_dict(self):
        return {
            "energy_id": self.energy_id,
            "meter_id": self.meter_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "electricity_usage": round(self.electricity_usage, 2),
            "water_usage": round(self.water_usage, 2),
            "hvac_usage": round(self.hvac_usage, 2),
            "lighting_usage": round(self.lighting_usage, 2),
            "equipment_usage": round(self.equipment_usage, 2),
            "temperature": round(self.temperature, 1),
        }


class EnergyAlert(Base):
    __tablename__ = "energy_alerts"

    alert_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    facility_id = Column(String(50), ForeignKey("facilities.facility_id", ondelete="CASCADE"), nullable=False, index=True)
    meter_id = Column(String(50), ForeignKey("energy_meters.meter_id", ondelete="CASCADE"), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)  # Low, Medium, High, Critical
    description = Column(String(255), nullable=False)
    actual_consumption = Column(Float, nullable=False)
    expected_consumption = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    # Relationships
    facility = relationship("Facility", back_populates="alerts")
    meter = relationship("EnergyMeter", back_populates="alerts")
    recommendations = relationship("EnergyRecommendation", back_populates="alert", cascade="all, delete-orphan")

    def to_dict(self):
        deviation_pct = 0.0
        if self.expected_consumption > 0:
            deviation_pct = ((self.actual_consumption - self.expected_consumption) / self.expected_consumption) * 100

        return {
            "alert_id": self.alert_id,
            "facility_id": self.facility_id,
            "meter_id": self.meter_id,
            "severity": self.severity,
            "description": self.description,
            "actual_consumption": round(self.actual_consumption, 2),
            "expected_consumption": round(self.expected_consumption, 2),
            "deviation_pct": round(deviation_pct, 1),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class EnergyRecommendation(Base):
    __tablename__ = "energy_recommendations"

    recommendation_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    alert_id = Column(Integer, ForeignKey("energy_alerts.alert_id", ondelete="SET NULL"), nullable=True, index=True)
    recommendation = Column(String(255), nullable=False)
    priority = Column(String(20), nullable=False, index=True)  # Low, Medium, High, Critical
    estimated_energy_savings = Column(Float, nullable=False)   # kWh
    estimated_cost_savings = Column(Float, nullable=False)     # USD / currency
    status = Column(String(20), default="Pending", nullable=False)  # Pending, Implemented, In Review
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    # Relationship
    alert = relationship("EnergyAlert", back_populates="recommendations")

    def to_dict(self):
        return {
            "recommendation_id": self.recommendation_id,
            "alert_id": self.alert_id,
            "recommendation": self.recommendation,
            "priority": self.priority,
            "estimated_energy_savings": round(self.estimated_energy_savings, 2),
            "estimated_cost_savings": round(self.estimated_cost_savings, 2),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ============================================================================
# MILESTONE 2: PREDICTIVE MAINTENANCE SYSTEM MODELS
# ============================================================================

class Asset(Base):
    __tablename__ = "assets"

    asset_id = Column(String(50), primary_key=True, index=True)
    asset_name = Column(String(100), nullable=False)
    asset_type = Column(String(50), nullable=False, index=True)  # Chiller, AHU, Cooling Tower, Pump, Motor, Generator, Elevator, Electrical Panel
    facility_id = Column(String(50), ForeignKey("facilities.facility_id", ondelete="CASCADE"), nullable=False, index=True)
    floor = Column(String(20), nullable=False, index=True)
    installation_date = Column(DateTime, nullable=False)
    last_maintenance_date = Column(DateTime, nullable=False)
    next_scheduled_maintenance = Column(DateTime, nullable=False)
    operational_status = Column(String(20), default="OPERATIONAL", nullable=False, index=True)  # OPERATIONAL, WARNING, DEGRADED, CRITICAL, MAINTENANCE
    temperature = Column(Float, nullable=False)  # °C
    vibration = Column(Float, nullable=False)    # mm/s RMS
    pressure = Column(Float, nullable=False)     # PSI
    power_consumption = Column(Float, nullable=False)  # kW
    runtime_hours = Column(Float, default=0.0, nullable=False)
    health_score = Column(Float, default=95.0, nullable=False, index=True)  # 0-100
    failure_risk_pct = Column(Float, default=5.0, nullable=False, index=True)  # 0-100%
    maintenance_priority = Column(String(20), default="Low", nullable=False, index=True)  # Low, Medium, High, Critical
    predicted_failure_days = Column(Integer, default=180, nullable=False)
    notes = Column(String(255), nullable=True)

    # Relationships
    facility = relationship("Facility", back_populates="assets")
    sensor_readings = relationship("AssetSensorReading", back_populates="asset", cascade="all, delete-orphan", order_by="desc(AssetSensorReading.timestamp)")
    health_history = relationship("AssetHealthHistory", back_populates="asset", cascade="all, delete-orphan", order_by="desc(AssetHealthHistory.timestamp)")
    alerts = relationship("MaintenanceAlert", back_populates="asset", cascade="all, delete-orphan", order_by="desc(MaintenanceAlert.created_at)")
    schedules = relationship("MaintenanceSchedule", back_populates="asset", cascade="all, delete-orphan", order_by="desc(MaintenanceSchedule.scheduled_date)")
    predictions = relationship("MaintenancePrediction", back_populates="asset", cascade="all, delete-orphan", order_by="desc(MaintenancePrediction.predicted_at)")

    @property
    def asset_age_years(self) -> float:
        if not self.installation_date:
            return 1.0
        delta = datetime.datetime.utcnow() - self.installation_date
        return round(max(0.1, delta.days / 365.25), 1)

    def to_dict(self):
        return {
            "asset_id": self.asset_id,
            "asset_name": self.asset_name,
            "asset_type": self.asset_type,
            "facility_id": self.facility_id,
            "floor": self.floor,
            "installation_date": self.installation_date.isoformat() if self.installation_date else None,
            "last_maintenance_date": self.last_maintenance_date.isoformat() if self.last_maintenance_date else None,
            "next_scheduled_maintenance": self.next_scheduled_maintenance.isoformat() if self.next_scheduled_maintenance else None,
            "operational_status": self.operational_status,
            "temperature": round(self.temperature, 1),
            "vibration": round(self.vibration, 2),
            "pressure": round(self.pressure, 1),
            "power_consumption": round(self.power_consumption, 1),
            "runtime_hours": round(self.runtime_hours, 1),
            "asset_age_years": self.asset_age_years,
            "health_score": round(self.health_score, 1),
            "failure_risk_pct": round(self.failure_risk_pct, 1),
            "maintenance_priority": self.maintenance_priority,
            "predicted_failure_days": self.predicted_failure_days,
            "notes": self.notes,
        }


class AssetSensorReading(Base):
    __tablename__ = "asset_sensor_readings"

    reading_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.asset_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    temperature = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    power_consumption = Column(Float, nullable=False)
    runtime_hours = Column(Float, nullable=False)

    # Relationship
    asset = relationship("Asset", back_populates="sensor_readings")

    def to_dict(self):
        return {
            "reading_id": self.reading_id,
            "asset_id": self.asset_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "temperature": round(self.temperature, 1),
            "vibration": round(self.vibration, 2),
            "pressure": round(self.pressure, 1),
            "power_consumption": round(self.power_consumption, 1),
            "runtime_hours": round(self.runtime_hours, 1),
        }


class AssetHealthHistory(Base):
    __tablename__ = "asset_health_history"

    history_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.asset_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    health_score = Column(Float, nullable=False)
    failure_risk_pct = Column(Float, nullable=False)
    contributing_factors = Column(String(500), nullable=True)  # JSON-formatted penalties description

    # Relationship
    asset = relationship("Asset", back_populates="health_history")

    def to_dict(self):
        return {
            "history_id": self.history_id,
            "asset_id": self.asset_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "health_score": round(self.health_score, 1),
            "failure_risk_pct": round(self.failure_risk_pct, 1),
            "contributing_factors": self.contributing_factors,
        }


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    alert_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.asset_id", ondelete="CASCADE"), nullable=False, index=True)
    facility_id = Column(String(50), nullable=False, index=True)
    floor = Column(String(20), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(500), nullable=False)
    severity = Column(String(20), nullable=False, index=True)  # Low, Medium, High, Critical
    sensor_readings = Column(String(500), nullable=True)       # JSON string with metrics
    recommended_action = Column(String(255), nullable=False)
    status = Column(String(20), default="NEW", nullable=False, index=True)  # NEW, ACKNOWLEDGED, RESOLVED
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)

    # Relationship
    asset = relationship("Asset", back_populates="alerts")

    def to_dict(self):
        return {
            "alert_id": self.alert_id,
            "id": self.alert_id,
            "asset_id": self.asset_id,
            "asset_name": self.asset.asset_name if self.asset else self.asset_id,
            "asset_type": self.asset.asset_type if self.asset else "Equipment",
            "facility_id": self.facility_id,
            "floor": self.floor,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "sensor_readings": self.sensor_readings,
            "recommended_action": self.recommended_action,
            "status": (self.status or "NEW").upper(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }


class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedules"

    schedule_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.asset_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(500), nullable=False)
    scheduled_date = Column(DateTime, nullable=False, index=True)
    priority = Column(String(20), default="Medium", nullable=False, index=True)  # Low, Medium, High, Critical
    assigned_technician = Column(String(100), nullable=False)
    status = Column(String(20), default="SCHEDULED", nullable=False, index=True)  # SCHEDULED, IN_PROGRESS, COMPLETED, OVERDUE
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(String(500), nullable=True)

    # Relationship
    asset = relationship("Asset", back_populates="schedules")

    def to_dict(self):
        return {
            "id": self.schedule_id,
            "schedule_id": self.schedule_id,
            "work_order_id": f"WO-{self.schedule_id:04d}",
            "asset_id": self.asset_id,
            "asset_name": self.asset.asset_name if self.asset else self.asset_id,
            "facility_id": self.asset.facility_id if self.asset else "FAC-001",
            "floor": self.asset.floor if self.asset else "Floor 1",
            "title": self.title,
            "description": self.description,
            "scheduled_date": self.scheduled_date.isoformat() if self.scheduled_date else None,
            "priority": self.priority,
            "assigned_technician": self.assigned_technician,
            "status": (self.status or "SCHEDULED").upper(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "notes": self.notes,
        }


class MaintenancePrediction(Base):
    __tablename__ = "maintenance_predictions"

    prediction_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.asset_id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    health_score = Column(Float, nullable=False)
    failure_risk_pct = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)  # Low, Medium, High, Critical
    estimated_days_to_failure = Column(Integer, nullable=False)
    recommendation = Column(String(255), nullable=False)
    reason = Column(String(500), nullable=False)
    anomalous_features = Column(String(500), nullable=True)

    # Relationship
    asset = relationship("Asset", back_populates="predictions")

    def to_dict(self):
        return {
            "prediction_id": self.prediction_id,
            "id": self.prediction_id,
            "asset_id": self.asset_id,
            "asset_name": self.asset.asset_name if self.asset else self.asset_id,
            "asset_type": self.asset.asset_type if self.asset else "Equipment",
            "facility_id": self.asset.facility_id if self.asset else "FAC-001",
            "floor": self.asset.floor if self.asset else "Floor 1",
            "predicted_at": self.predicted_at.isoformat() if self.predicted_at else None,
            "health_score": round(self.health_score, 1),
            "failure_risk_pct": round(self.failure_risk_pct, 1),
            "risk_level": self.risk_level,
            "estimated_days_to_failure": self.estimated_days_to_failure,
            "recommendation": self.recommendation,
            "reason": self.reason,
            "anomalous_features": self.anomalous_features,
        }
