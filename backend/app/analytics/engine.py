import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config import settings
from app.database.models import Facility, EnergyMeter, EnergyUsage, EnergyAlert

class EnergyAnalyticsEngine:
    """
    Pandas & NumPy Powered Smart Facility Energy Analytics Engine.
    Computes KPIs, time-series distributions, floor comparisons,
    cost conversions, and carbon footprints.
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def get_dataframe(self, facility_id: Optional[str] = None, days: int = 30) -> pd.DataFrame:
        """Loads usage records into a clean Pandas DataFrame."""
        cutoff = datetime.utcnow() - timedelta(days=days)

        query = (
            self.db.query(
                EnergyUsage.timestamp,
                EnergyUsage.electricity_usage,
                EnergyUsage.water_usage,
                EnergyUsage.hvac_usage,
                EnergyUsage.lighting_usage,
                EnergyUsage.equipment_usage,
                EnergyUsage.temperature,
                EnergyMeter.meter_id,
                EnergyMeter.floor,
                EnergyMeter.facility_id,
                Facility.facility_name
            )
            .join(EnergyMeter, EnergyUsage.meter_id == EnergyMeter.meter_id)
            .join(Facility, EnergyMeter.facility_id == Facility.facility_id)
            .filter(EnergyUsage.timestamp >= cutoff)
        )

        if facility_id and facility_id.lower() != "all":
            query = query.filter(EnergyMeter.facility_id == facility_id)

        rows = query.all()
        if not rows:
            return pd.DataFrame()

        data = [
            {
                "timestamp": r.timestamp,
                "electricity_usage": r.electricity_usage,
                "water_usage": r.water_usage,
                "hvac_usage": r.hvac_usage,
                "lighting_usage": r.lighting_usage,
                "equipment_usage": r.equipment_usage,
                "temperature": r.temperature,
                "meter_id": r.meter_id,
                "floor": r.floor,
                "facility_id": r.facility_id,
                "facility_name": r.facility_name
            }
            for r in rows
        ]
        df = pd.DataFrame(data)
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp")
        return df

    def compute_kpis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculates dashboard KPI metrics."""
        if df.empty:
            return {
                "total_electricity_kwh": 0.0,
                "total_water_litres": 0.0,
                "estimated_cost_usd": 0.0,
                "energy_efficiency_score": 85,
                "detected_anomalies_count": 0,
                "carbon_emissions_kg": 0.0,
                "avg_hourly_kwh": 0.0,
                "peak_demand_kwh": 0.0,
                "hvac_percentage": 0.0,
                "lighting_percentage": 0.0,
                "equipment_percentage": 0.0,
                "active_meters_count": 0,
                "date_range": {"start": "-", "end": "-"}
            }

        df = df.copy()
        df["timestamp"] = pd.to_datetime(df["timestamp"])

        total_elec = float(df["electricity_usage"].sum())
        total_water = float(df["water_usage"].sum())
        total_hvac = float(df["hvac_usage"].sum())
        total_lighting = float(df["lighting_usage"].sum())
        total_equipment = float(df["equipment_usage"].sum())

        # Cost: Electricity ($0.14/kWh) + Water ($0.004/Litre)
        elec_cost = total_elec * settings.ELECTRICITY_TARIFF_PER_KWH
        water_cost = total_water * settings.WATER_TARIFF_PER_LITRE
        total_cost = round(elec_cost + water_cost, 2)

        # Carbon Emissions: 0.42 kg CO2 / kWh
        carbon_kg = round(total_elec * settings.CARBON_FACTOR_KG_PER_KWH, 2)

        # Peak & Averages
        hourly_grouped = df.groupby(pd.Grouper(key="timestamp", freq="1h"))["electricity_usage"].sum()
        peak_demand = round(float(hourly_grouped.max()) if not hourly_grouped.empty else 0.0, 2)
        avg_hourly = round(float(hourly_grouped.mean()) if not hourly_grouped.empty else 0.0, 2)

        # Efficiency Score calculation (0 - 100):
        # 1. Load factor (avg / peak) -> ideal around 0.65-0.75
        load_factor = (avg_hourly / peak_demand) if peak_demand > 0 else 0.7
        lf_component = min(35.0, load_factor * 45.0)

        # 2. Night vs Day ratio check (efficient office has night load < 30% of day load)
        df_copy = df.copy()
        df_copy["hour"] = df_copy["timestamp"].dt.hour
        night_mask = (df_copy["hour"] < 6) | (df_copy["hour"] > 21)
        night_avg = df_copy[night_mask]["electricity_usage"].mean() if not df_copy[night_mask].empty else 1.0
        day_avg = df_copy[~night_mask]["electricity_usage"].mean() if not df_copy[~night_mask].empty else 1.0
        night_ratio = night_avg / (day_avg if day_avg > 0 else 1.0)
        night_component = max(15.0, 35.0 - (night_ratio * 40.0))

        # 3. Subsystem balance (HVAC should not exceed 65% of total)
        hvac_ratio = (total_hvac / total_elec) if total_elec > 0 else 0.4
        balance_component = 30.0 if hvac_ratio <= 0.60 else max(10.0, 30.0 - ((hvac_ratio - 0.60) * 100.0))

        efficiency_score = int(np.clip(lf_component + night_component + balance_component, 50, 96))

        # Count active anomalies in database
        alerts_count = self.db.query(func.count(EnergyAlert.alert_id)).scalar() or 0

        # Percentages
        hvac_pct = round((total_hvac / total_elec * 100), 1) if total_elec > 0 else 45.0
        lighting_pct = round((total_lighting / total_elec * 100), 1) if total_elec > 0 else 25.0
        equip_pct = round((total_equipment / total_elec * 100), 1) if total_elec > 0 else 25.0

        return {
            "total_electricity_kwh": round(total_elec, 2),
            "total_water_litres": round(total_water, 2),
            "estimated_cost_usd": total_cost,
            "energy_efficiency_score": efficiency_score,
            "detected_anomalies_count": int(alerts_count),
            "carbon_emissions_kg": carbon_kg,
            "avg_hourly_kwh": avg_hourly,
            "peak_demand_kwh": peak_demand,
            "hvac_percentage": hvac_pct,
            "lighting_percentage": lighting_pct,
            "equipment_percentage": equip_pct,
            "active_meters_count": int(df["meter_id"].nunique()),
            "date_range": {
                "start": df["timestamp"].min().strftime("%Y-%m-%d"),
                "end": df["timestamp"].max().strftime("%Y-%m-%d")
            }
        }

    def compute_timeseries(self, df: pd.DataFrame, freq: str = "1h") -> List[Dict[str, Any]]:
        """Groups consumption by hourly, daily, or weekly time intervals."""
        if df.empty:
            return []

        df = df.copy()
        df["timestamp"] = pd.to_datetime(df["timestamp"])

        # Aggregate across meters by time bucket
        resampled = (
            df.set_index("timestamp")
            .resample(freq)[["electricity_usage", "water_usage", "hvac_usage", "lighting_usage", "equipment_usage"]]
            .sum()
            .reset_index()
        )

        # Compute a smooth baseline expectation (e.g. 7-period rolling median)
        resampled["baseline_expected"] = (
            resampled["electricity_usage"]
            .rolling(window=7, min_periods=1, center=True)
            .median()
            .round(2)
        )

        points = []
        for _, row in resampled.iterrows():
            points.append({
                "timestamp": row["timestamp"].strftime("%Y-%m-%d %H:%M" if freq == "1h" else "%Y-%m-%d"),
                "electricity_usage": round(float(row["electricity_usage"]), 2),
                "water_usage": round(float(row["water_usage"]), 2),
                "hvac_usage": round(float(row["hvac_usage"]), 2),
                "lighting_usage": round(float(row["lighting_usage"]), 2),
                "equipment_usage": round(float(row["equipment_usage"]), 2),
                "baseline_expected": round(float(row["baseline_expected"]), 2)
            })

        return points

    def compute_distribution(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Subsystem breakdown & floor-wise comparison."""
        if df.empty:
            return {"categories": [], "floor_wise": []}

        total_elec = float(df["electricity_usage"].sum())
        total_hvac = float(df["hvac_usage"].sum())
        total_lighting = float(df["lighting_usage"].sum())
        total_equipment = float(df["equipment_usage"].sum())
        other = max(0.0, total_elec - (total_hvac + total_lighting + total_equipment))

        categories = [
            {"name": "HVAC Systems", "value": round(total_hvac, 2), "percentage": round(total_hvac / total_elec * 100, 1) if total_elec else 0, "color": "#0284c7"},
            {"name": "Lighting", "value": round(total_lighting, 2), "percentage": round(total_lighting / total_elec * 100, 1) if total_elec else 0, "color": "#f59e0b"},
            {"name": "Plug & Equipment", "value": round(total_equipment, 2), "percentage": round(total_equipment / total_elec * 100, 1) if total_elec else 0, "color": "#10b981"},
            {"name": "Other Systems", "value": round(other, 2), "percentage": round(other / total_elec * 100, 1) if total_elec else 0, "color": "#8b5cf6"}
        ]

        # Floor-wise comparison
        floor_df = (
            df.groupby("floor")[["electricity_usage", "hvac_usage", "lighting_usage", "equipment_usage", "water_usage"]]
            .sum()
            .reset_index()
        )

        floor_wise = []
        for _, row in floor_df.iterrows():
            floor_elec = float(row["electricity_usage"])
            floor_wise.append({
                "floor": row["floor"],
                "electricity_kwh": round(floor_elec, 2),
                "hvac_kwh": round(float(row["hvac_usage"]), 2),
                "lighting_kwh": round(float(row["lighting_usage"]), 2),
                "equipment_kwh": round(float(row["equipment_usage"]), 2),
                "water_litres": round(float(row["water_usage"]), 2),
                "percentage": round(floor_elec / total_elec * 100, 1) if total_elec else 0
            })

        return {
            "categories": categories,
            "floor_wise": sorted(floor_wise, key=lambda x: x["floor"])
        }
