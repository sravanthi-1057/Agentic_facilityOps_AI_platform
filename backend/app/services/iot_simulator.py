import random
import datetime
import math
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.config import settings

class IoTSimulator:
    """
    Realistic Smart Building IoT Energy & Utility Data Simulator.
    Simulates diurnal office cycles, seasonal temperature variations,
    subsystem energy distributions, and controlled anomaly patterns.
    """

    FACILITIES = [
        {
            "facility_id": "FAC-001",
            "facility_name": "Main Tech Tower",
            "facility_type": "Commercial Office",
            "location": "North Campus, Bangalore",
            "floors": ["Floor 1", "Floor 2", "Floor 3", "Floor 4"]
        },
        {
            "facility_id": "FAC-002",
            "facility_name": "Innovation & R&D Hub",
            "facility_type": "R&D Laboratories",
            "location": "South Campus, Bangalore",
            "floors": ["Floor 1", "Floor 2"]
        }
    ]

    def __init__(self, seed: int = 42):
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)

    def generate_meter_catalog(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Generates facility and meter registry."""
        facilities = []
        meters = []

        for fac in self.FACILITIES:
            facilities.append({
                "facility_id": fac["facility_id"],
                "facility_name": fac["facility_name"],
                "facility_type": fac["facility_type"],
                "location": fac["location"]
            })
            for fl in fac["floors"]:
                fl_num = fl.replace("Floor ", "FL")
                meter_id = f"MTR-{fac['facility_id'].split('-')[1]}-{fl_num}-MAIN"
                meters.append({
                    "meter_id": meter_id,
                    "facility_id": fac["facility_id"],
                    "floor": fl,
                    "meter_type": "Main Smart Meter",
                    "status": "ACTIVE"
                })

        return facilities, meters

    def generate_timeseries(self, days: int = 35) -> pd.DataFrame:
        """
        Generates at least 30-35 days of hourly realistic energy data
        with normal patterns and controlled anomalies.
        """
        facilities, meters = self.generate_meter_catalog()
        end_time = datetime.datetime.now().replace(minute=0, second=0, microsecond=0)
        start_time = end_time - datetime.timedelta(days=days)

        records = []
        current_time = start_time

        while current_time <= end_time:
            hour = current_time.hour
            day_of_week = current_time.weekday()  # 0=Monday, 6=Sunday
            is_weekend = 1 if day_of_week >= 5 else 0

            # Base outdoor temperature with realistic day/night curve
            # Daily temp oscillates between ~20°C (night) and ~33°C (afternoon)
            temp_diurnal = math.sin((hour - 9) * math.pi / 12)
            base_temp = 26.5 + (6.5 * temp_diurnal) + np.random.normal(0, 0.8)

            for meter in meters:
                floor_idx = int(meter["floor"].replace("Floor ", ""))
                base_scale = 1.0 + (floor_idx * 0.15)  # Higher floors slightly higher load

                # Occupancy pattern (0.0 to 1.0)
                if is_weekend:
                    occupancy = 0.05 + np.random.uniform(0, 0.05)
                elif 8 <= hour <= 18:
                    # Peak working hours
                    lunch_dip = 0.15 if 13 <= hour <= 14 else 0.0
                    occupancy = min(0.95, 0.70 + (0.25 * math.sin((hour - 8) * math.pi / 10)) - lunch_dip + np.random.normal(0, 0.04))
                elif 6 <= hour < 8 or 19 <= hour <= 21:
                    # Transition hours
                    occupancy = 0.15 + np.random.uniform(0, 0.08)
                else:
                    # Night hours
                    occupancy = 0.02 + np.random.uniform(0, 0.02)

                # Base Subsystems in kWh
                # HVAC responds strongly to temperature and occupancy
                temp_factor = max(0.0, (base_temp - 22.0) / 10.0)
                hvac = base_scale * (8.0 + (18.0 * occupancy) + (14.0 * temp_factor) + np.random.normal(0, 0.8))

                # Lighting responds to operating hours and darkness
                lighting_base = 3.0 if (7 <= hour <= 20) else 0.8
                lighting = base_scale * (lighting_base + (6.5 * occupancy) + np.random.normal(0, 0.4))

                # Equipment (servers, computers, lab gear)
                equipment_base = 6.0  # continuous baseload
                equipment = base_scale * (equipment_base + (10.0 * occupancy) + np.random.normal(0, 0.6))

                # Other small loads (elevators, chargers)
                other_load = base_scale * (2.0 + (3.0 * occupancy) + np.random.normal(0, 0.3))

                # Water consumption (Litres/hr) - peaks during lunch and morning
                water_peak = 1.8 if (12 <= hour <= 14 or 9 <= hour <= 10) else 0.5
                water = base_scale * (25.0 + (120.0 * occupancy * water_peak) + np.random.normal(0, 5.0))
                water = max(10.0, water)

                # Total electricity
                electricity = hvac + lighting + equipment + other_load

                # Normal flag
                is_anomaly = 0
                anomaly_type = "Normal"

                # Controlled Injected Anomalies (~3.5% of records for evaluation)
                # Anomaly Scenario 1: Overnight HVAC stuck at full load (2am - 5am)
                if (current_time.day % 7 == 2) and (2 <= hour <= 4) and (floor_idx == 2):
                    hvac += 32.0  # massive HVAC spike during unoccupied night
                    electricity += 32.0
                    is_anomaly = 1
                    anomaly_type = "Unscheduled Nighttime HVAC Operation"

                # Anomaly Scenario 2: Weekend lighting system left completely ON
                elif is_weekend and (10 <= hour <= 16) and (floor_idx == 3) and (current_time.day % 5 == 0):
                    lighting += 14.0
                    electricity += 14.0
                    is_anomaly = 1
                    anomaly_type = "Abnormal Weekend Lighting Wastage"

                # Anomaly Scenario 3: Equipment power surge / server room overload
                elif (current_time.day % 9 == 4) and (14 <= hour <= 16) and (floor_idx == 1):
                    equipment += 28.0
                    electricity += 28.0
                    is_anomaly = 1
                    anomaly_type = "Peak Equipment Surge"

                # Anomaly Scenario 4: Plumbing leak / cooling tower valve stuck
                elif (current_time.day % 11 == 1) and (1 <= hour <= 5) and (meter["facility_id"] == "FAC-001"):
                    water += 180.0
                    is_anomaly = 1
                    anomaly_type = "Severe Water Leakage / Valve Anomaly"

                records.append({
                    "facility_id": meter["facility_id"],
                    "meter_id": meter["meter_id"],
                    "floor": meter["floor"],
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "electricity_usage": round(max(5.0, electricity), 2),
                    "water_usage": round(max(5.0, water), 2),
                    "hvac_usage": round(max(2.0, hvac), 2),
                    "lighting_usage": round(max(0.5, lighting), 2),
                    "equipment_usage": round(max(1.0, equipment), 2),
                    "temperature": round(base_temp, 1),
                    "occupancy": round(occupancy, 2),
                    "is_anomaly": is_anomaly,
                    "anomaly_type": anomaly_type
                })

            current_time += datetime.timedelta(hours=1)

        df = pd.DataFrame(records)
        return df

    def export_csv(self, file_path: Path, days: int = 35) -> pd.DataFrame:
        df = self.generate_timeseries(days=days)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(file_path, index=False)
        return df

simulator = IoTSimulator()
