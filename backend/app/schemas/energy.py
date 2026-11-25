from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class FacilitySchema(BaseModel):
    facility_id: str
    facility_name: str
    facility_type: str
    location: str

class EnergyMeterSchema(BaseModel):
    meter_id: str
    facility_id: str
    floor: str
    meter_type: str
    status: str

class EnergyUsageRecord(BaseModel):
    timestamp: str
    electricity_usage: float
    water_usage: float
    hvac_usage: float
    lighting_usage: float
    equipment_usage: float
    temperature: float

class EnergySummary(BaseModel):
    total_electricity_kwh: float
    total_water_litres: float
    estimated_cost_usd: float
    energy_efficiency_score: int
    detected_anomalies_count: int
    carbon_emissions_kg: float
    avg_hourly_kwh: float
    peak_demand_kwh: float
    hvac_percentage: float
    lighting_percentage: float
    equipment_percentage: float
    active_meters_count: int
    date_range: Dict[str, str]

class TimeSeriesPoint(BaseModel):
    timestamp: str
    electricity_usage: float
    water_usage: float
    hvac_usage: float
    lighting_usage: float
    equipment_usage: float
    baseline_expected: Optional[float] = None

class FloorConsumption(BaseModel):
    floor: str
    electricity_kwh: float
    hvac_kwh: float
    lighting_kwh: float
    equipment_kwh: float
    water_litres: float
    percentage: float

class CategoryBreakdown(BaseModel):
    name: str
    value: float
    percentage: float
    color: str

class EnergyDistributionResponse(BaseModel):
    categories: List[CategoryBreakdown]
    floor_wise: List[FloorConsumption]

class AnomalyItem(BaseModel):
    alert_id: int
    facility_id: str
    meter_id: str
    floor: Optional[str] = "Floor 1"
    severity: str  # Low, Medium, High, Critical
    description: str
    actual_consumption: float
    expected_consumption: float
    deviation_pct: float
    timestamp: str
    explanation: Optional[str] = None

class RecommendationItem(BaseModel):
    recommendation_id: int
    alert_id: Optional[int] = None
    title: str
    description: str
    reason: str
    facility_id: str
    floor: str
    priority: str  # Low, Medium, High, Critical
    estimated_energy_savings_kwh: float
    estimated_cost_savings_usd: float
    suggested_action: str
    status: str
    created_at: str

class ForecastPoint(BaseModel):
    timestamp: str
    actual: Optional[float] = None
    baseline_expected: float
    upper_bound: float
    lower_bound: float

class IngestionResult(BaseModel):
    status: str
    filename: str
    total_rows_processed: int
    valid_rows_inserted: int
    duplicate_rows_skipped: int
    invalid_rows_rejected: int
    anomalies_detected: int
    details: Optional[List[str]] = []
