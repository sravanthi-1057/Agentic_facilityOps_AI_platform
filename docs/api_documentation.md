# REST API Documentation
## Milestone 1 (Energy Intelligence) & Milestone 2 (Predictive Maintenance)

The platform backend provides a RESTful API built on **FastAPI**. Interactive Swagger UI documentation is available at `http://localhost:8000/docs`.

---

## 1. System & Health

### `GET /api/health`
Retrieves platform operational status, database connection states, and simulation flags.

---

## 2. Milestone 1: Energy Intelligence Endpoints

### `GET /api/facilities`
Returns registered facilities with metadata and monitored floor levels.

### `GET /api/energy/summary`
Calculates KPI totals for electricity (kWh), water (Litres), estimated utility cost ($), carbon footprint, and energy efficiency score.

### `GET /api/energy/consumption`
Returns time-series consumption aggregated by `hourly`, `daily`, or `weekly` buckets.

### `GET /api/energy/distribution`
Aggregates end-use breakdown across HVAC, lighting, equipment, and water.

### `GET /api/energy/anomalies`
Returns flagged anomaly events detected by Scikit-Learn Isolation Forest.

### `GET /api/energy/recommendations`
Returns actionable energy-saving recommendations with estimated kWh and dollar savings.

### `POST /api/energy/analyze`
Triggers the 5-node LangGraph Energy Agent workflow.

---

## 3. Milestone 2: Predictive Maintenance Endpoints

Base route prefix: `/api/maintenance`

### A. Fleet KPIs & Overview

#### `GET /api/maintenance/kpis`
Calculates fleet-wide maintenance health and risk KPIs.
- **Parameters**: `facility_id` (optional, e.g., `FAC-001`, `all`)
- **Response**:
```json
{
  "total_assets": 10,
  "healthy_assets": 7,
  "warning_assets": 2,
  "critical_assets": 1,
  "avg_health_score": 78.4,
  "pending_alerts": 3,
  "critical_alerts": 1,
  "overdue_maintenance": 1,
  "scheduled_work_orders": 4
}
```

---

### B. Asset Monitoring & Sensor Telemetry

#### `GET /api/maintenance/assets`
Returns asset catalog with real-time health scores, operational status, failure risk %, and latest sensor telemetry.
- **Parameters**:
  - `facility_id`: Filter by building ID (`all` or `FAC-001`)
  - `asset_type`: Filter by equipment category (`Chiller`, `AHU`, `Pump`, etc.)
  - `status`: Filter by operational condition (`Normal`, `Warning`, `Degraded`, `Critical`)
  - `min_health` / `max_health`: Health score range
- **Response**: Array of `AssetSummarySchema` objects.

#### `GET /api/maintenance/assets/{asset_id}`
Returns complete diagnostic details for a specific equipment asset, including:
- Asset metadata, commissioning date, last maintenance date
- Latest physical telemetry (temperature, vibration, pressure, power, runtime)
- Health score and failure risk %
- Contributing factor penalty breakdown
- 30-day historical telemetry time series
- 30-day health history snapshots
- Active alerts and upcoming scheduled work orders
- Latest predictive diagnosis and recommendation

#### `GET /api/maintenance/assets/{asset_id}/readings`
Returns time-series sensor readings for an asset.
- **Parameters**: `limit` (default: 50, max: 500)

#### `GET /api/maintenance/assets/{asset_id}/history`
Returns historical health score and failure risk progression for an asset.

---

### C. Predictive Failure Analysis

#### `GET /api/maintenance/predictions`
Returns machine-learning and rule-derived failure predictions across all monitored assets.
- **Parameters**:
  - `facility_id`: (optional)
  - `risk_level`: Filter by `Critical`, `High`, `Medium`, `Low`
- **Response**:
```json
[
  {
    "prediction_id": 1,
    "asset_id": "AST-001-CHL-01",
    "asset_name": "Chilled Water Centrifugal Chiller 1",
    "facility_id": "FAC-001",
    "health_score": 52.0,
    "failure_risk": 78.0,
    "risk_level": "Critical",
    "estimated_days_to_failure": 5,
    "recommendation": "Emergency bearing inspection, laser shaft alignment, and oil lubrication flush required.",
    "reason": "Vibration levels (4.80 mm/s) exceed ISO 10816 Class IV boundary. Operating temperature is 18.4°C above design nominal.",
    "abnormal_readings": {
      "vibration_mms": 4.8,
      "temperature_c": 78.4,
      "pressure_psi": 58.2
    },
    "created_at": "2026-11-25T14:30:00Z"
  }
]
```

---

### D. Maintenance Alerts Lifecycle

#### `GET /api/maintenance/alerts`
Returns equipment maintenance alerts.
- **Parameters**: `facility_id`, `severity` (`Critical`, `High`, `Medium`, `Low`), `status` (`New`, `Acknowledged`, `Resolved`), `limit`

#### `POST /api/maintenance/alerts/{alert_id}/acknowledge`
Transitions alert status from `New` to `Acknowledged` with timestamp.

#### `POST /api/maintenance/alerts/{alert_id}/resolve`
Transitions alert status to `Resolved` with resolution timestamp.

---

### E. Work Orders & Maintenance Schedules

#### `GET /api/maintenance/schedules`
Lists scheduled preventive and corrective work orders.
- **Parameters**: `facility_id`, `status` (`Scheduled`, `In Progress`, `Completed`, `Overdue`), `priority`

#### `POST /api/maintenance/schedules`
Dispatches a new maintenance work order.
- **Body**:
```json
{
  "asset_id": "AST-001-CHL-01",
  "title": "Chiller 1 Bearing Overhaul",
  "description": "Disassemble bearing housing, replace worn thrust bearings, dynamic balancing.",
  "scheduled_date": "2026-11-28T09:00:00Z",
  "priority": "Critical",
  "assigned_technician": "Vikram Sharma (HVAC Specialist)",
  "notes": "Lockout/Tagout required before opening inspection hatch."
}
```

#### `PUT /api/maintenance/schedules/{schedule_id}`
Updates work order details, status (`In Progress`), technician assignment, or notes.

#### `POST /api/maintenance/schedules/{schedule_id}/complete`
Marks a maintenance work order as completed.
- Automatically updates `last_maintenance_date` on the target asset.
- Automatically resets runtime-since-maintenance and restores asset health score.
- **Body**:
```json
{
  "notes": "Bearing replacement complete. Shaft alignment verified to 0.02 mm tolerance. Vibration normalized to 1.1 mm/s."
}
```

---

### F. Real-Time Telemetry Simulation & AI Agent Execution

#### `POST /api/maintenance/refresh-sensors`
Simulates a real-time IoT physical telemetry update cycle across all equipment:
- Advances runtime hours and simulates dynamic thermal/vibrational physics.
- Automatically recomputes health scores and failure risks.
- Emits new maintenance alerts if equipment crosses safe boundaries.

#### `POST /api/maintenance/agent/run`
Executes the autonomous 7-node LangGraph Maintenance AI Agent:
1. **Asset Validation Node**
2. **Sensor Condition Analysis Node**
3. **Health Scoring Node (0–100)**
4. **Failure Risk Prediction Node**
5. **Prescriptive Maintenance Recommendation Node**
6. **Alert Generation Node**
7. **Database Persistence Node**
- Logs execution telemetry to MongoDB / DocStore.
