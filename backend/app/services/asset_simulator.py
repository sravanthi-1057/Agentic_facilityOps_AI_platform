import random
import datetime
import json
import numpy as np
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.database.models import (
    Asset,
    AssetSensorReading,
    AssetHealthHistory,
    MaintenanceAlert,
    MaintenanceSchedule,
    MaintenancePrediction,
    Facility
)
from app.database.mongodb import get_mongo_db

class AssetSimulator:
    """
    Realistic Smart Facility Asset & Predictive IoT Telemetry Simulator.
    Simulates operational parameters, sensor physics, bearing vibration,
    thermal degradation, runtime hours, and controlled failure states.
    """

    ASSET_SPECIFICATIONS = {
        "Chiller": {
            "temp_nominal": 34.0, "temp_std": 2.5, "temp_max": 42.0,
            "vib_nominal": 1.4, "vib_std": 0.3, "vib_max": 4.5,
            "pressure_nominal": 52.0, "pressure_std": 4.0, "pressure_min": 35.0, "pressure_max": 75.0,
            "power_nominal": 75.0, "power_std": 12.0,
            "service_interval_hrs": 6000
        },
        "AHU": {
            "temp_nominal": 21.0, "temp_std": 1.5, "temp_max": 30.0,
            "vib_nominal": 1.2, "vib_std": 0.25, "vib_max": 3.8,
            "pressure_nominal": 2.1, "pressure_std": 0.3, "pressure_min": 1.0, "pressure_max": 3.5,
            "power_nominal": 24.0, "power_std": 4.0,
            "service_interval_hrs": 4000
        },
        "Cooling Tower": {
            "temp_nominal": 28.5, "temp_std": 2.0, "temp_max": 36.0,
            "vib_nominal": 2.1, "vib_std": 0.4, "vib_max": 5.0,
            "pressure_nominal": 28.0, "pressure_std": 3.0, "pressure_min": 18.0, "pressure_max": 45.0,
            "power_nominal": 30.0, "power_std": 5.0,
            "service_interval_hrs": 4500
        },
        "Pump": {
            "temp_nominal": 48.0, "temp_std": 3.0, "temp_max": 68.0,
            "vib_nominal": 1.8, "vib_std": 0.35, "vib_max": 4.8,
            "pressure_nominal": 45.0, "pressure_std": 3.5, "pressure_min": 25.0, "pressure_max": 65.0,
            "power_nominal": 18.5, "power_std": 2.5,
            "service_interval_hrs": 5000
        },
        "Motor": {
            "temp_nominal": 58.0, "temp_std": 4.0, "temp_max": 80.0,
            "vib_nominal": 1.5, "vib_std": 0.3, "vib_max": 4.2,
            "pressure_nominal": 14.7, "pressure_std": 0.5, "pressure_min": 12.0, "pressure_max": 20.0,
            "power_nominal": 15.0, "power_std": 2.0,
            "service_interval_hrs": 4000
        },
        "Generator": {
            "temp_nominal": 76.0, "temp_std": 5.0, "temp_max": 95.0,
            "vib_nominal": 2.8, "vib_std": 0.5, "vib_max": 6.5,
            "pressure_nominal": 50.0, "pressure_std": 4.0, "pressure_min": 30.0, "pressure_max": 70.0,
            "power_nominal": 120.0, "power_std": 20.0,
            "service_interval_hrs": 500
        },
        "Elevator": {
            "temp_nominal": 32.0, "temp_std": 2.0, "temp_max": 45.0,
            "vib_nominal": 0.8, "vib_std": 0.2, "vib_max": 2.5,
            "pressure_nominal": 15.0, "pressure_std": 1.0, "pressure_min": 10.0, "pressure_max": 25.0,
            "power_nominal": 28.0, "power_std": 5.0,
            "service_interval_hrs": 3000
        },
        "Electrical Panel": {
            "temp_nominal": 38.0, "temp_std": 3.0, "temp_max": 60.0,
            "vib_nominal": 0.2, "vib_std": 0.05, "vib_max": 1.0,
            "pressure_nominal": 14.7, "pressure_std": 0.2, "pressure_min": 13.0, "pressure_max": 16.0,
            "power_nominal": 220.0, "power_std": 35.0,
            "service_interval_hrs": 8760
        }
    }

    INITIAL_ASSETS = [
        # FAC-001 (Main Tech Tower)
        {
            "asset_id": "AST-CHL-001",
            "asset_name": "Centrifugal Chiller 1 (Base Plant)",
            "asset_type": "Chiller",
            "facility_id": "FAC-001",
            "floor": "Basement",
            "installation_years_ago": 4.2,
            "last_maintenance_days_ago": 190,
            "runtime_hours": 7200,
            "condition_profile": "critical" # Tube fouling + elevated head temp
        },
        {
            "asset_id": "AST-CHL-002",
            "asset_name": "Centrifugal Chiller 2 (Secondary)",
            "asset_type": "Chiller",
            "facility_id": "FAC-001",
            "floor": "Basement",
            "installation_years_ago": 2.8,
            "last_maintenance_days_ago": 45,
            "runtime_hours": 3400,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-AHU-001",
            "asset_name": "Roof Primary AHU 1",
            "asset_type": "AHU",
            "facility_id": "FAC-001",
            "floor": "Rooftop",
            "installation_years_ago": 3.5,
            "last_maintenance_days_ago": 30,
            "runtime_hours": 4200,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-AHU-002",
            "asset_name": "Floor 2 Supply Air Handling Unit",
            "asset_type": "AHU",
            "facility_id": "FAC-001",
            "floor": "Floor 2",
            "installation_years_ago": 5.0,
            "last_maintenance_days_ago": 140,
            "runtime_hours": 6100,
            "condition_profile": "warning" # Filter pressure drop + belt slip
        },
        {
            "asset_id": "AST-AHU-003",
            "asset_name": "Floor 3 Supply Air Handling Unit",
            "asset_type": "AHU",
            "facility_id": "FAC-001",
            "floor": "Floor 3",
            "installation_years_ago": 2.0,
            "last_maintenance_days_ago": 20,
            "runtime_hours": 2100,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-CTW-001",
            "asset_name": "Induced Draft Cooling Tower A",
            "asset_type": "Cooling Tower",
            "facility_id": "FAC-001",
            "floor": "Rooftop",
            "installation_years_ago": 4.0,
            "last_maintenance_days_ago": 60,
            "runtime_hours": 4800,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-PMP-001",
            "asset_name": "Primary Chilled Water Pump 1",
            "asset_type": "Pump",
            "facility_id": "FAC-001",
            "floor": "Basement",
            "installation_years_ago": 3.2,
            "last_maintenance_days_ago": 40,
            "runtime_hours": 3900,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-PMP-002",
            "asset_name": "Condenser Water Circulation Pump 2",
            "asset_type": "Pump",
            "facility_id": "FAC-001",
            "floor": "Basement",
            "installation_years_ago": 6.1,
            "last_maintenance_days_ago": 165,
            "runtime_hours": 8900,
            "condition_profile": "degraded" # Impeller unbalance + high bearing vibration
        },
        {
            "asset_id": "AST-MTR-001",
            "asset_name": "Basement Exhaust Fan Motor",
            "asset_type": "Motor",
            "facility_id": "FAC-001",
            "floor": "Basement",
            "installation_years_ago": 4.5,
            "last_maintenance_days_ago": 80,
            "runtime_hours": 5100,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-GEN-001",
            "asset_name": "Emergency Diesel Generator 500kVA",
            "asset_type": "Generator",
            "facility_id": "FAC-001",
            "floor": "Basement",
            "installation_years_ago": 5.5,
            "last_maintenance_days_ago": 210,
            "runtime_hours": 620,
            "condition_profile": "warning" # Overdue oil and fuel filter service
        },
        {
            "asset_id": "AST-ELV-001",
            "asset_name": "Passenger Elevator Bank A1",
            "asset_type": "Elevator",
            "facility_id": "FAC-001",
            "floor": "Floor 1",
            "installation_years_ago": 2.5,
            "last_maintenance_days_ago": 25,
            "runtime_hours": 2900,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-ELV-002",
            "asset_name": "Freight Service Elevator",
            "asset_type": "Elevator",
            "facility_id": "FAC-001",
            "floor": "Floor 1",
            "installation_years_ago": 5.8,
            "last_maintenance_days_ago": 70,
            "runtime_hours": 5400,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-PNL-001",
            "asset_name": "Main Low Voltage Switchboard MSB-01",
            "asset_type": "Electrical Panel",
            "facility_id": "FAC-001",
            "floor": "Basement",
            "installation_years_ago": 4.0,
            "last_maintenance_days_ago": 90,
            "runtime_hours": 9800,
            "condition_profile": "normal"
        },

        # FAC-002 (Innovation & R&D Hub)
        {
            "asset_id": "AST-CHL-003",
            "asset_name": "Laboratory Precision Screw Chiller",
            "asset_type": "Chiller",
            "facility_id": "FAC-002",
            "floor": "Basement",
            "installation_years_ago": 1.8,
            "last_maintenance_days_ago": 15,
            "runtime_hours": 1900,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-AHU-004",
            "asset_name": "Cleanroom AHU 1 (R&D Labs)",
            "asset_type": "AHU",
            "facility_id": "FAC-002",
            "floor": "Floor 1",
            "installation_years_ago": 2.2,
            "last_maintenance_days_ago": 28,
            "runtime_hours": 2400,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-PMP-003",
            "asset_name": "Process Chilled Water Booster Pump",
            "asset_type": "Pump",
            "facility_id": "FAC-002",
            "floor": "Basement",
            "installation_years_ago": 3.0,
            "last_maintenance_days_ago": 55,
            "runtime_hours": 3600,
            "condition_profile": "normal"
        },
        {
            "asset_id": "AST-PNL-002",
            "asset_name": "Lab Precision Distribution Panel PDU-A",
            "asset_type": "Electrical Panel",
            "facility_id": "FAC-002",
            "floor": "Floor 2",
            "installation_years_ago": 3.9,
            "last_maintenance_days_ago": 110,
            "runtime_hours": 8200,
            "condition_profile": "warning" # Slight thermal hotspot on Phase B breaker
        }
    ]

    def __init__(self, seed: int = 42):
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)

    def generate_sensor_values(self, asset_type: str, condition_profile: str = "normal") -> Tuple[float, float, float, float]:
        """
        Generates realistic (temp, vibration, pressure, power) sensor values
        correlated with physical asset operational conditions.
        """
        spec = self.ASSET_SPECIFICATIONS.get(asset_type, self.ASSET_SPECIFICATIONS["Pump"])

        base_temp = spec["temp_nominal"] + np.random.normal(0, spec["temp_std"])
        base_vib = max(0.1, spec["vib_nominal"] + np.random.normal(0, spec["vib_std"]))
        base_press = max(1.0, spec["pressure_nominal"] + np.random.normal(0, spec["pressure_std"]))
        base_pwr = max(1.0, spec["power_nominal"] + np.random.normal(0, spec["power_std"]))

        if condition_profile == "critical":
            # Severe thermal elevation and abnormal pressure
            temp = base_temp + 14.5 + np.random.uniform(0, 3.0)
            vib = base_vib + 2.8 + np.random.uniform(0, 0.8)
            pressure = base_press + 18.0 if asset_type == "Chiller" else base_press * 1.6
            power = base_pwr * 1.35
        elif condition_profile == "degraded":
            # Significant mechanical vibration & elevated temperature
            temp = base_temp + 8.0 + np.random.uniform(0, 2.0)
            vib = base_vib + 2.4 + np.random.uniform(0, 0.5)
            pressure = base_press * 0.75 if "Pump" in asset_type else base_press * 1.2
            power = base_pwr * 1.2
        elif condition_profile == "warning":
            # Moderate deviation
            temp = base_temp + 4.5 + np.random.uniform(0, 1.5)
            vib = base_vib + 0.9 + np.random.uniform(0, 0.3)
            pressure = base_press * 1.15
            power = base_pwr * 1.08
        else:
            # Normal baseline
            temp = base_temp
            vib = base_vib
            pressure = base_press
            power = base_pwr

        return round(float(temp), 1), round(float(vib), 2), round(float(pressure), 1), round(float(power), 1)

    def calculate_health_and_risk(
        self,
        asset_type: str,
        temp: float,
        vib: float,
        pressure: float,
        runtime_hrs: float,
        days_since_maint: int,
        age_years: float
    ) -> Tuple[float, float, str, int, Dict[str, Any]]:
        """
        Calculates equipment Health Score (0-100) and Failure Risk % (0-100%)
        based on multi-factor physics penalties and maintenance schedules.
        """
        spec = self.ASSET_SPECIFICATIONS.get(asset_type, self.ASSET_SPECIFICATIONS["Pump"])
        score = 100.0
        penalties = {}

        # 1. Temperature Penalty (up to -30 pts)
        temp_delta = temp - spec["temp_nominal"]
        if temp_delta > 0:
            temp_ratio = temp_delta / max(1.0, (spec["temp_max"] - spec["temp_nominal"]))
            t_pen = min(30.0, temp_ratio * 30.0)
            score -= t_pen
            if t_pen > 5:
                penalties["temperature"] = f"+{temp_delta:.1f}°C above nominal (-{t_pen:.1f} pts)"

        # 2. Vibration Severity Penalty (ISO 10816 standards, up to -35 pts)
        vib_delta = vib - spec["vib_nominal"]
        if vib_delta > 0:
            v_ratio = vib_delta / max(0.5, (spec["vib_max"] - spec["vib_nominal"]))
            v_pen = min(35.0, v_ratio * 35.0)
            score -= v_pen
            if v_pen > 5:
                penalties["vibration"] = f"{vib:.2f} mm/s RMS vs {spec['vib_nominal']:.2f} baseline (-{v_pen:.1f} pts)"

        # 3. Pressure Penalty (up to -20 pts)
        press_dev = abs(pressure - spec["pressure_nominal"])
        press_range = max(1.0, (spec["pressure_max"] - spec["pressure_min"]) / 2.0)
        p_ratio = press_dev / press_range
        if p_ratio > 0.5:
            p_pen = min(20.0, (p_ratio - 0.5) * 20.0)
            score -= p_pen
            if p_pen > 4:
                penalties["pressure"] = f"Pressure deviated by {press_dev:.1f} PSI (-{p_pen:.1f} pts)"

        # 4. Runtime / Service Interval Penalty (up to -15 pts)
        service_int = spec.get("service_interval_hrs", 5000)
        runtime_over = runtime_hrs % service_int
        r_ratio = runtime_over / service_int
        if r_ratio > 0.85:
            r_pen = min(15.0, (r_ratio - 0.85) * 100.0)
            score -= r_pen
            if r_pen > 4:
                penalties["runtime"] = f"Approaching service interval: {runtime_hrs:.0f} hrs (-{r_pen:.1f} pts)"

        # 5. Overdue Maintenance Penalty (up to -15 pts)
        if days_since_maint > 180:
            overdue_days = days_since_maint - 180
            o_pen = min(15.0, (overdue_days / 60.0) * 15.0)
            score -= o_pen
            if o_pen > 3:
                penalties["overdue_maintenance"] = f"{days_since_maint} days since last inspection (-{o_pen:.1f} pts)"

        # Bounded Health Score
        health_score = round(float(np.clip(score, 15.0, 99.0)), 1)

        # Failure Risk % (inverse of health score with non-linear acceleration below 60)
        if health_score >= 85:
            failure_risk_pct = round(float(np.clip((100.0 - health_score) * 0.8, 3.0, 15.0)), 1)
            priority = "Low"
            days_to_failure = random.randint(120, 240)
        elif health_score >= 70:
            failure_risk_pct = round(float(np.clip((100.0 - health_score) * 1.1, 16.0, 34.0)), 1)
            priority = "Medium"
            days_to_failure = random.randint(45, 90)
        elif health_score >= 50:
            failure_risk_pct = round(float(np.clip((100.0 - health_score) * 1.4, 35.0, 69.0)), 1)
            priority = "High"
            days_to_failure = random.randint(12, 35)
        else:
            failure_risk_pct = round(float(np.clip(70.0 + ((50.0 - health_score) * 0.6), 70.0, 96.0)), 1)
            priority = "Critical"
            days_to_failure = random.randint(2, 8)

        return health_score, failure_risk_pct, priority, days_to_failure, penalties

    def seed_initial_assets(self, db: Session) -> Dict[str, Any]:
        """
        Seeds the database with rich multi-building facility assets,
        historical sensor telemetry, health history, alerts, and schedules.
        """
        # Ensure facilities exist
        for fac_id, fac_name in [("FAC-001", "Main Tech Tower"), ("FAC-002", "Innovation & R&D Hub")]:
            if not db.query(Facility).filter(Facility.facility_id == fac_id).first():
                db.add(Facility(
                    facility_id=fac_id,
                    facility_name=fac_name,
                    facility_type="Commercial Office",
                    location="Campus, Bangalore"
                ))
        db.commit()

        now = datetime.datetime.utcnow()
        seeded_assets = 0

        for a_def in self.INITIAL_ASSETS:
            existing = db.query(Asset).filter(Asset.asset_id == a_def["asset_id"]).first()
            if existing:
                continue

            inst_date = now - datetime.timedelta(days=int(a_def["installation_years_ago"] * 365.25))
            last_maint = now - datetime.timedelta(days=a_def["last_maintenance_days_ago"])
            next_maint = last_maint + datetime.timedelta(days=180)

            temp, vib, press, pwr = self.generate_sensor_values(
                a_def["asset_type"], a_def["condition_profile"]
            )

            health, risk, priority, days_to_fail, penalties = self.calculate_health_and_risk(
                asset_type=a_def["asset_type"],
                temp=temp,
                vib=vib,
                pressure=press,
                runtime_hrs=a_def["runtime_hours"],
                days_since_maint=a_def["last_maintenance_days_ago"],
                age_years=a_def["installation_years_ago"]
            )

            # Map operational status
            if health < 45:
                op_status = "CRITICAL"
            elif health < 60:
                op_status = "DEGRADED"
            elif health < 75:
                op_status = "WARNING"
            else:
                op_status = "OPERATIONAL"

            asset = Asset(
                asset_id=a_def["asset_id"],
                asset_name=a_def["asset_name"],
                asset_type=a_def["asset_type"],
                facility_id=a_def["facility_id"],
                floor=a_def["floor"],
                installation_date=inst_date,
                last_maintenance_date=last_maint,
                next_scheduled_maintenance=next_maint,
                operational_status=op_status,
                temperature=temp,
                vibration=vib,
                pressure=press,
                power_consumption=pwr,
                runtime_hours=float(a_def["runtime_hours"]),
                health_score=health,
                failure_risk_pct=risk,
                maintenance_priority=priority,
                predicted_failure_days=days_to_fail,
                notes=f"Installed {inst_date.strftime('%b %Y')} in {a_def['facility_id']} ({a_def['floor']})"
            )
            db.add(asset)
            db.flush()
            seeded_assets += 1

            # Generate 10 historical telemetry points
            for d in range(10, 0, -1):
                hist_time = now - datetime.timedelta(days=d)
                h_temp = max(10.0, temp + np.random.normal(0, 0.8))
                h_vib = max(0.1, vib + np.random.normal(0, 0.1))
                h_press = max(1.0, press + np.random.normal(0, 1.2))
                h_pwr = max(1.0, pwr + np.random.normal(0, 1.5))
                h_runtime = max(0.0, a_def["runtime_hours"] - (d * 18.0))

                reading = AssetSensorReading(
                    asset_id=asset.asset_id,
                    timestamp=hist_time,
                    temperature=round(h_temp, 1),
                    vibration=round(h_vib, 2),
                    pressure=round(h_press, 1),
                    power_consumption=round(h_pwr, 1),
                    runtime_hours=round(h_runtime, 1)
                )
                db.add(reading)

                # Health history
                h_score = min(100.0, health + (d * 0.4))
                h_risk = max(5.0, risk - (d * 0.3))
                db.add(AssetHealthHistory(
                    asset_id=asset.asset_id,
                    timestamp=hist_time,
                    health_score=round(h_score, 1),
                    failure_risk_pct=round(h_risk, 1),
                    contributing_factors=json.dumps(penalties)
                ))

            # Initial alert for critical / warning assets
            if op_status in ["CRITICAL", "DEGRADED", "WARNING"]:
                sev = "Critical" if op_status == "CRITICAL" else "High" if op_status == "DEGRADED" else "Medium"
                alert = MaintenanceAlert(
                    asset_id=asset.asset_id,
                    facility_id=asset.facility_id,
                    floor=asset.floor,
                    title=f"Abnormal {asset.asset_type} Behavior Detected",
                    description=f"{asset.asset_name} health score degraded to {health}/100. Key anomalies: {', '.join(penalties.values()) or 'Elevated telemetry'}.",
                    severity=sev,
                    sensor_readings=json.dumps({
                        "temperature": temp,
                        "vibration": vib,
                        "pressure": press,
                        "runtime_hours": a_def["runtime_hours"]
                    }),
                    recommended_action=f"Dispatch maintenance technician to inspect {asset.asset_type.lower()} assembly and perform diagnostic tune-up.",
                    status="NEW",
                    created_at=now - datetime.timedelta(hours=random.randint(2, 48))
                )
                db.add(alert)

            # Initial prediction record
            db.add(MaintenancePrediction(
                asset_id=asset.asset_id,
                predicted_at=now,
                health_score=health,
                failure_risk_pct=risk,
                risk_level=priority,
                estimated_days_to_failure=days_to_fail,
                recommendation=f"Recommended service window: within {days_to_fail} days. Preventive overhaul recommended.",
                reason=f"Contributing telemetry: {', '.join(penalties.values()) or 'Standard operating degradation'}",
                anomalous_features=json.dumps(penalties)
            ))

        # Seed initial maintenance schedules
        technicians = [
            "Vikram Sharma (HVAC Specialist)",
            "Priya Nair (Reliability Engineer)",
            "Anil Kulkarni (Vibration Analyst)",
            "Suresh Rao (Plant Electrical Lead)"
        ]

        # Scheduled task for degraded Chiller
        if not db.query(MaintenanceSchedule).filter(MaintenanceSchedule.asset_id == "AST-CHL-001").first():
            db.add(MaintenanceSchedule(
                asset_id="AST-CHL-001",
                title="Emergency Condenser Tube Cleaning & Chiller Overhaul",
                description="Perform chemical descaling on condenser tubes, recalibrate approach temperature sensors, and check compressor oil acidity.",
                scheduled_date=now + datetime.timedelta(days=2),
                priority="Critical",
                assigned_technician=technicians[0],
                status="SCHEDULED",
                created_at=now - datetime.timedelta(days=1),
                notes="Chiller running at high condenser head temperature. Risk of trip during peak afternoon load."
            ))

        # Scheduled task for Pump
        if not db.query(MaintenanceSchedule).filter(MaintenanceSchedule.asset_id == "AST-PMP-002").first():
            db.add(MaintenanceSchedule(
                asset_id="AST-PMP-002",
                title="Pump Impeller Dynamic Balancing & Bearing Replacement",
                description="Inspect drive-end and non-drive-end bearings for spalling, check shaft alignment, and dynamically rebalance pump impeller.",
                scheduled_date=now + datetime.timedelta(days=5),
                priority="High",
                assigned_technician=technicians[2],
                status="SCHEDULED",
                created_at=now - datetime.timedelta(days=2),
                notes="Vibration analyst reported 4.2 mm/s RMS unbalance frequency signature."
            ))

        # Routine task for Generator
        if not db.query(MaintenanceSchedule).filter(MaintenanceSchedule.asset_id == "AST-GEN-001").first():
            db.add(MaintenanceSchedule(
                asset_id="AST-GEN-001",
                title="Semi-Annual Generator Fluid & Load Bank Test",
                description="Replace oil filters, fuel water separators, test battery float voltage, and run 30-min load bank test.",
                scheduled_date=now - datetime.timedelta(days=15),
                priority="Medium",
                assigned_technician=technicians[3],
                status="OVERDUE",
                created_at=now - datetime.timedelta(days=30),
                notes="Overdue maintenance flag active. Safety compliance required for life-safety systems."
            ))

        # Completed historical task
        if not db.query(MaintenanceSchedule).filter(MaintenanceSchedule.asset_id == "AST-AHU-001").first():
            db.add(MaintenanceSchedule(
                asset_id="AST-AHU-001",
                title="Quarterly Filter Replacement & V-Belt Tensioning",
                description="Replaced MERV 13 pocket filters and tensioned fan drive belts to 65 Hz deflection frequency.",
                scheduled_date=now - datetime.timedelta(days=20),
                priority="Low",
                assigned_technician=technicians[1],
                status="COMPLETED",
                created_at=now - datetime.timedelta(days=35),
                completed_at=now - datetime.timedelta(days=19),
                notes="Completed successfully. Filter differential pressure returned to nominal 1.2 in.wg."
            ))

        db.commit()
        return {"status": "SUCCESS", "seeded_assets": seeded_assets}

    def refresh_sensor_readings(self, db: Session) -> Dict[str, Any]:
        """
        Simulates updated real-time sensor streams for all assets.
        Recalculates health scores, updates failure risks, logs telemetry,
        and generates non-duplicate alerts.
        """
        assets = db.query(Asset).all()
        if not assets:
            self.seed_initial_assets(db)
            assets = db.query(Asset).all()

        now = datetime.datetime.utcnow()
        updated_count = 0
        new_alerts_count = 0
        raw_events_batch = []

        for asset in assets:
            spec = self.ASSET_SPECIFICATIONS.get(asset.asset_type, self.ASSET_SPECIFICATIONS["Pump"])

            # Determine drift based on current operational status
            if asset.operational_status == "CRITICAL":
                # Persistently critical conditions with slight jitter
                temp = spec["temp_max"] + np.random.uniform(0.5, 3.5)
                vib = spec["vib_max"] + np.random.uniform(0.2, 0.8)
                press = spec["pressure_max"] + np.random.uniform(2.0, 8.0)
                pwr = spec["power_nominal"] * 1.35
            elif asset.operational_status in ["DEGRADED", "WARNING"]:
                temp = spec["temp_nominal"] + (spec["temp_max"] - spec["temp_nominal"]) * 0.75 + np.random.normal(0, 1.0)
                vib = spec["vib_nominal"] + (spec["vib_max"] - spec["vib_nominal"]) * 0.70 + np.random.normal(0, 0.2)
                press = spec["pressure_nominal"] + np.random.normal(0, 3.0)
                pwr = spec["power_nominal"] * 1.15
            else:
                # Normal operational jitter with occasional slight thermal/vibration drift
                temp = spec["temp_nominal"] + np.random.normal(0, spec["temp_std"])
                vib = max(0.1, spec["vib_nominal"] + np.random.normal(0, spec["vib_std"]))
                press = max(1.0, spec["pressure_nominal"] + np.random.normal(0, spec["pressure_std"]))
                pwr = max(1.0, spec["power_nominal"] + np.random.normal(0, spec["power_std"]))

            # Advance runtime hours
            runtime = asset.runtime_hours + random.uniform(1.0, 4.0)

            # Days since maintenance
            days_since = (now - asset.last_maintenance_date).days if asset.last_maintenance_date else 90

            health, risk, priority, days_to_fail, penalties = self.calculate_health_and_risk(
                asset_type=asset.asset_type,
                temp=temp,
                vib=vib,
                pressure=press,
                runtime_hrs=runtime,
                days_since_maint=days_since,
                age_years=asset.asset_age_years
            )

            # Update status
            if health < 45:
                op_status = "CRITICAL"
            elif health < 60:
                op_status = "DEGRADED"
            elif health < 75:
                op_status = "WARNING"
            else:
                op_status = "OPERATIONAL"

            # Update asset record
            asset.temperature = round(float(temp), 1)
            asset.vibration = round(float(vib), 2)
            asset.pressure = round(float(press), 1)
            asset.power_consumption = round(float(pwr), 1)
            asset.runtime_hours = round(float(runtime), 1)
            asset.health_score = health
            asset.failure_risk_pct = risk
            asset.maintenance_priority = priority
            asset.predicted_failure_days = days_to_fail
            asset.operational_status = op_status

            # Append sensor reading record
            reading = AssetSensorReading(
                asset_id=asset.asset_id,
                timestamp=now,
                temperature=asset.temperature,
                vibration=asset.vibration,
                pressure=asset.pressure,
                power_consumption=asset.power_consumption,
                runtime_hours=asset.runtime_hours
            )
            db.add(reading)

            # Record health history
            db.add(AssetHealthHistory(
                asset_id=asset.asset_id,
                timestamp=now,
                health_score=health,
                failure_risk_pct=risk,
                contributing_factors=json.dumps(penalties)
            ))

            # Raw MongoDB event
            raw_events_batch.append({
                "asset_id": asset.asset_id,
                "asset_name": asset.asset_name,
                "asset_type": asset.asset_type,
                "facility_id": asset.facility_id,
                "floor": asset.floor,
                "timestamp": now.isoformat(),
                "temperature": asset.temperature,
                "vibration": asset.vibration,
                "pressure": asset.pressure,
                "power_consumption": asset.power_consumption,
                "runtime_hours": asset.runtime_hours,
                "health_score": health,
                "failure_risk_pct": risk,
                "status": op_status
            })

            # Check threshold breaches and generate alerts
            if op_status in ["CRITICAL", "DEGRADED", "WARNING"]:
                # Prevent duplicate alert if an active (NEW or ACKNOWLEDGED) alert already exists for this asset
                existing_alert = (
                    db.query(MaintenanceAlert)
                    .filter(
                        MaintenanceAlert.asset_id == asset.asset_id,
                        MaintenanceAlert.status.in_(["NEW", "ACKNOWLEDGED"])
                    )
                    .first()
                )

                if not existing_alert:
                    sev = "Critical" if op_status == "CRITICAL" else "High" if op_status == "DEGRADED" else "Medium"
                    action = (
                        f"Immediate shutdown inspection for {asset.asset_name}. Rebuild bearings and clean heat exchangers."
                        if sev == "Critical"
                        else f"Schedule diagnostic inspection and lubrication tune-up within 72 hours."
                    )
                    new_alert = MaintenanceAlert(
                        asset_id=asset.asset_id,
                        facility_id=asset.facility_id,
                        floor=asset.floor,
                        title=f"{sev} Threshold Breach on {asset.asset_name}",
                        description=f"Health degraded to {health}/100. Factors: {', '.join(penalties.values()) or 'High sensor deviation'}.",
                        severity=sev,
                        sensor_readings=json.dumps({
                            "temperature": asset.temperature,
                            "vibration": asset.vibration,
                            "pressure": asset.pressure,
                            "power_consumption": asset.power_consumption
                        }),
                        recommended_action=action,
                        status="NEW",
                        created_at=now
                    )
                    db.add(new_alert)
                    new_alerts_count += 1

            # Update prediction record
            db.add(MaintenancePrediction(
                asset_id=asset.asset_id,
                predicted_at=now,
                health_score=health,
                failure_risk_pct=risk,
                risk_level=priority,
                estimated_days_to_failure=days_to_fail,
                recommendation=f"Recommended service window: within {days_to_fail} days. Preventive overhaul advised.",
                reason=f"Contributing telemetry: {', '.join(penalties.values()) or 'Standard operating degradation'}",
                anomalous_features=json.dumps(penalties)
            ))

            updated_count += 1

        db.commit()

        # Ingest to MongoDB document store
        mongo = get_mongo_db()
        try:
            mongo.asset_sensor_events.insert_many(raw_events_batch)
        except Exception:
            pass

        return {
            "status": "TELEMETRY_REFRESHED",
            "assets_updated": updated_count,
            "new_alerts_generated": new_alerts_count,
            "timestamp": now.isoformat()
        }

asset_simulator = AssetSimulator()
