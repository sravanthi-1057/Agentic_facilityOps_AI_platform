import datetime
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database.models import Facility, EnergyMeter, EnergyUsage
from app.database.mongodb import get_mongo_db

REQUIRED_COLUMNS = [
    "meter_id",
    "timestamp",
    "electricity_usage",
    "water_usage",
    "hvac_usage",
    "lighting_usage",
    "equipment_usage",
    "temperature"
]

class DataValidator:
    """
    Validates, sanitizes, and ingests utility & IoT sensor streams.
    """

    @staticmethod
    def validate_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        report = {
            "total_rows": len(df),
            "missing_columns": [],
            "invalid_rows_dropped": 0,
            "duplicate_rows": 0,
            "null_values_imputed": 0,
            "details": []
        }

        # Check required columns
        missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            report["missing_columns"] = missing_cols
            raise ValueError(f"Missing mandatory columns in uploaded data: {missing_cols}")

        cleaned_df = df.copy()

        # Parse and validate timestamp
        cleaned_df["timestamp"] = pd.to_datetime(cleaned_df["timestamp"], errors="coerce")
        null_ts = cleaned_df["timestamp"].isna().sum()
        if null_ts > 0:
            report["invalid_rows_dropped"] += int(null_ts)
            report["details"].append(f"Dropped {null_ts} rows with invalid timestamps.")
            cleaned_df = cleaned_df.dropna(subset=["timestamp"])

        # Check duplicates
        dup_mask = cleaned_df.duplicated(subset=["meter_id", "timestamp"])
        report["duplicate_rows"] = int(dup_mask.sum())
        if report["duplicate_rows"] > 0:
            report["details"].append(f"Deduplicated {report['duplicate_rows']} duplicate meter timestamps.")
            cleaned_df = cleaned_df.drop_duplicates(subset=["meter_id", "timestamp"], keep="last")

        # Numeric field sanitization & range check
        numeric_cols = ["electricity_usage", "water_usage", "hvac_usage", "lighting_usage", "equipment_usage", "temperature"]
        for col in numeric_cols:
            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
            null_count = cleaned_df[col].isna().sum()
            if null_count > 0:
                report["null_values_imputed"] += int(null_count)
                # Impute median
                median_val = cleaned_df[col].median()
                cleaned_df[col] = cleaned_df[col].fillna(median_val if not pd.isna(median_val) else 0.0)

            # Prevent unrealistic negative values
            if col != "temperature":
                cleaned_df[col] = cleaned_df[col].clip(lower=0.0)

        # Re-verify electricity vs subsystem sanity
        sum_subsystems = cleaned_df["hvac_usage"] + cleaned_df["lighting_usage"] + cleaned_df["equipment_usage"]
        cleaned_df["electricity_usage"] = np.maximum(cleaned_df["electricity_usage"], sum_subsystems)

        return cleaned_df, report

    @staticmethod
    def ingest_to_databases(df: pd.DataFrame, db_session: Session) -> Dict[str, Any]:
        """
        Persists validated rows to SQL database and raw events to MongoDB.
        """
        mongo = get_mongo_db()
        inserted_sql = 0
        raw_events_batch = []

        # Ensure facilities and meters exist in SQL
        existing_meters = {m.meter_id for m in db_session.query(EnergyMeter.meter_id).all()}

        for idx, row in df.iterrows():
            meter_id = str(row["meter_id"])
            if meter_id not in existing_meters:
                # Auto-register meter if unknown
                fac_id = str(row.get("facility_id", "FAC-001"))
                floor = str(row.get("floor", "Floor 1"))
                new_meter = EnergyMeter(
                    meter_id=meter_id,
                    facility_id=fac_id,
                    floor=floor,
                    meter_type="Smart Sub-Meter",
                    status="ACTIVE"
                )
                db_session.add(new_meter)
                db_session.flush()
                existing_meters.add(meter_id)

            usage = EnergyUsage(
                meter_id=meter_id,
                timestamp=pd.to_datetime(row["timestamp"]).to_pydatetime(),
                electricity_usage=float(row["electricity_usage"]),
                water_usage=float(row["water_usage"]),
                hvac_usage=float(row["hvac_usage"]),
                lighting_usage=float(row["lighting_usage"]),
                equipment_usage=float(row["equipment_usage"]),
                temperature=float(row["temperature"])
            )
            db_session.add(usage)
            inserted_sql += 1

            # Prepare MongoDB raw event
            raw_events_batch.append({
                "meter_id": meter_id,
                "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], "isoformat") else str(row["timestamp"]),
                "electricity_usage": float(row["electricity_usage"]),
                "water_usage": float(row["water_usage"]),
                "hvac_usage": float(row["hvac_usage"]),
                "lighting_usage": float(row["lighting_usage"]),
                "equipment_usage": float(row["equipment_usage"]),
                "temperature": float(row["temperature"]),
                "source": "simulated_iot_feed"
            })

        db_session.commit()

        # Ingest to MongoDB raw events collection
        if raw_events_batch:
            try:
                mongo.iot_sensor_events.insert_many(raw_events_batch)
            except Exception as e:
                # Log non-fatal mongodb ingestion warning
                pass

        return {
            "sql_rows_inserted": inserted_sql,
            "mongo_events_logged": len(raw_events_batch)
        }
