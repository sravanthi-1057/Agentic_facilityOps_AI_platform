# Agentic FacilityOps AI Platform
## Milestone 1 & Milestone 2 – Energy Intelligence & Predictive Maintenance
**Infosys Springboard Virtual Internship Deliverable**

An enterprise-grade, Agentic AI-powered Facility Operations platform that integrates smart building utility telemetry and physical equipment sensors. It monitors electricity and water consumption, detects energy wastage with **Isolation Forest Machine Learning**, evaluates equipment health, predicts mechanical failures, and generates autonomous operational and maintenance actions using **LangGraph Multi-Agent Workflows**.

---

## 1. Project Overview & Milestones

The **Agentic FacilityOps AI Platform** integrates two core enterprise modules:
1. **Milestone 1: Energy Intelligence & Monitoring** — Monitors facility electricity and water consumption, identifies energy wastage with **96.44% anomaly detection accuracy**, and generates cost-saving recommendations.
2. **Milestone 2: Predictive Maintenance System** — Monitors critical building equipment (chillers, AHUs, pumps, cooling towers, motors, generators, elevators, electrical panels), scores equipment health on a 0–100 scale, predicts failure risk and Remaining Useful Life (RUL), and manages maintenance work orders.

---

## 2. Milestone Deliverables & Verification Matrix

| Milestone | Requirement / Objective | Status | Implementation Details |
|---|---|---|---|
| **M1** | **Integrate Utility & IoT Data** | **COMPLETED** | Multi-facility, multi-floor CSV ingestion, validation, and storage. |
| **M1** | **Energy Anomaly Detection ($\ge 85\%$)** | **COMPLETED** | **$96.44\%$ Test Accuracy** achieved using Scikit-Learn Isolation Forest. |
| **M1** | **LangGraph Energy Agent** | **COMPLETED** | 5-Node Linear StateGraph (Validation → Analytics → Anomaly → Recommendations → Persistence). |
| **M1** | **Energy Monitoring Dashboard** | **COMPLETED** | Interactive React + Vite dashboard with Recharts visualizations. |
| **M1** | **AI Energy Recommendations** | **COMPLETED** | Rule-based engine with quantifiable kWh & dollar savings calculations. |
| **M2** | **Maintenance AI Agent** | **COMPLETED** | 7-Node LangGraph Agent (Validation → Condition → Health → Risk → Recommendations → Alerts → Persistence). |
| **M2** | **Asset Monitoring (8 Categories)** | **COMPLETED** | Chillers, AHUs, Towers, Pumps, Motors, Generators, Elevators, Panels across floors. |
| **M2** | **Equipment Health Scoring (0–100)** | **COMPLETED** | Multi-factor physics scoring (Temperature deltas, ISO 10816 Vibration, Pressure, Runtime). |
| **M2** | **Predictive Failure Risk & RUL** | **COMPLETED** | Failure risk % calculation, estimated days to failure, and prescriptive diagnostic reasoning. |
| **M2** | **Maintenance Alerts Management** | **COMPLETED** | 4 severity tiers (Critical, High, Medium, Low) with Acknowledge and Resolve workflow. |
| **M2** | **Work Order Scheduling Lifecycle** | **COMPLETED** | Create, dispatch, and complete work orders (completing restores asset health). |
| **M2** | **Real-Time IoT Sensor Stream** | **COMPLETED** | "Simulate Sensor Stream" action injects dynamic physics telemetry and updates health scores. |

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 (SPA)
- **Tooling**: Vite 5
- **Styling**: Tailwind CSS 3
- **Visualizations**: Recharts (Line, Area, Bar, and Gauge charts)
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend & Agentic AI
- **Language**: Python 3.11 / 3.12
- **Framework**: FastAPI (Asynchronous REST API)
- **Validation**: Pydantic v2
- **Data Engineering**: Pandas 2.2, NumPy 1.26
- **Agent Orchestration**: LangGraph 1.2, LangChain Core
- **Anomaly Detection**: Scikit-Learn 1.9 (Isolation Forest)
- **Equipment Diagnostics**: ISO 10816 Vibration Severity Standards & Multi-Factor Health Engine
- **Testing**: Pytest & FastAPI TestClient (22 Integration Tests)

### Databases
- **Relational Storage**: MySQL 8.0 via SQLAlchemy 2.0 (with automatic SQLite development fallback)
- **Document Storage**: MongoDB 7.0 via Motor / PyMongo (with automatic JSON DocStore fallback)

---

## 4. Multi-Agent System Architecture

```
                       Simulated IoT Sensors & Telemetry Stream
                         (Utility Meters + Equipment Sensors)
                                          │
                                          ▼
                                   FastAPI Backend
                                          │
                               ┌──────────┴──────────┐
                               ▼                     ▼
                             MySQL                MongoDB
                           (SQLite)              (DocStore)
                               │                     │
                ┌──────────────┴─────────────────────┴──────────────┐
                │                                                   │
                ▼                                                   ▼
     LangGraph Energy Agent                              LangGraph Maintenance Agent
     ┌───────────────────────────────┐                   ┌───────────────────────────────────┐
     │ 1. Data Validation Node       │                   │ 1. Asset Validation Node          │
     │ 2. Energy Analysis Node       │                   │ 2. Condition Analysis Node        │
     │ 3. Isolation Forest Anomaly   │                   │ 3. Health Scoring (0–100)         │
     │ 4. Recommendations Engine     │                   │ 4. Predictive Failure Risk & RUL  │
     │ 5. Database Persistence       │                   │ 5. Prescriptive Maintenance Action│
     └───────────────────────────────┘                   │ 6. Alert & Threshold Engine       │
                │                                        │ 7. Relational Persistence         │
                │                                        └───────────────────────────────────┘
                │                                                   │
                └───────────────────────┬───────────────────────────┘
                                        │
                                        ▼
                                FastAPI REST APIs
                           (/api/energy/*, /api/maintenance/*)
                                        │
                                        ▼
                         React 18 + Tailwind Dashboard
      ┌──────────────────────────────────────────────────────────────────┐
      │  [Energy Intelligence]            [Predictive Maintenance]       │
      │  • Overview & KPIs                • Asset Monitoring Catalog     │
      │  • Energy Monitoring (Floorwise)  • Predictive Failure & RUL     │
      │  • Consumption Analytics          • Maintenance Alerts Console   │
      │  • Anomaly Detection Alerts       • Work Orders & Scheduling     │
      │  • Cost Saving Recommendations    • Asset Diagnostic Modal       │
      └──────────────────────────────────────────────────────────────────┘
```

---

## 5. Folder Structure

```
agentic_ai_project/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── energy_agent.py          # LangGraph Energy Agent (5 nodes)
│   │   │   └── maintenance_agent.py     # LangGraph Maintenance Agent (7 nodes)
│   │   ├── database/
│   │   │   ├── connection.py            # MySQL & SQLite connection
│   │   │   ├── models.py                # SQLAlchemy ORM (10 tables)
│   │   │   └── mongodb.py               # MongoDB & DocStore connection
│   │   ├── routes/
│   │   │   ├── energy.py                # Milestone 1 API endpoints
│   │   │   └── maintenance.py           # Milestone 2 API endpoints (15 routes)
│   │   ├── schemas/
│   │   │   ├── energy.py                # Pydantic schemas (M1)
│   │   │   └── maintenance.py           # Pydantic schemas (M2)
│   │   ├── services/
│   │   │   ├── analytics_engine.py      # Energy analytics
│   │   │   ├── anomaly_detector.py      # Isolation Forest ML
│   │   │   ├── asset_simulator.py       # Equipment catalog & physics simulator
│   │   │   ├── maintenance_engine.py    # Health scoring, risk & work orders
│   │   │   └── recommendation_engine.py # Energy efficiency recommendations
│   │   ├── config.py
│   │   └── main.py                      # FastAPI application entrypoint
│   └── tests/
│       ├── test_agent.py                # Energy agent test
│       ├── test_analytics.py            # Analytics tests
│       ├── test_anomaly.py              # Anomaly detection & accuracy tests
│       ├── test_api.py                  # Energy REST API tests
│       └── test_maintenance.py          # Predictive maintenance tests (8 tests)
├── data/
│   ├── energy_data.csv                  # 5,046 simulated utility rows
│   ├── generate_data.py                 # Telemetry simulator
│   └── models/
│       └── isolation_forest.joblib      # Trained ML model
├── docs/
│   ├── anomaly_evaluation.md            # ML accuracy evaluation report (96.44%)
│   ├── api_documentation.md             # Complete REST API reference
│   ├── architecture.md                  # System architecture
│   ├── database_schema.md               # SQL & MongoDB schema specifications
│   └── maintenance_architecture.md      # Predictive maintenance design & physics
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AssetDetailModal.jsx     # Equipment telemetry & diagnostic modal
│   │   │   ├── CreateScheduleModal.jsx  # Work order dispatch modal
│   │   │   ├── MaintenanceAgentModal.jsx# LangGraph 7-node visual execution trace
│   │   │   ├── AgentModal.jsx           # Energy agent execution modal
│   │   │   ├── Sidebar.jsx              # Navigation with M1 & M2 sections
│   │   │   └── TopNav.jsx               # Facility selector, actions & status
│   │   ├── pages/
│   │   │   ├── OverviewPage.jsx         # Energy overview
│   │   │   ├── MonitoringPage.jsx       # Energy monitoring
│   │   │   ├── AnalyticsPage.jsx        # Energy analytics
│   │   │   ├── AnomalyPage.jsx          # Energy anomaly alerts
│   │   │   ├── RecommendationsPage.jsx  # Energy recommendations
│   │   │   ├── AssetMonitoringPage.jsx  # Equipment health & telemetry (M2)
│   │   │   ├── PredictiveMaintenancePage.jsx # Failure risk & RUL (M2)
│   │   │   ├── MaintenanceAlertsPage.jsx# 4-tier alert console (M2)
│   │   │   ├── MaintenanceSchedulePage.jsx # Work orders & schedule (M2)
│   │   │   ├── DataManagementPage.jsx   # Data ingestion
│   │   │   └── SettingsPage.jsx         # System status & database health
│   │   ├── services/
│   │   │   └── api.js                   # Axios API client (All endpoints)
│   │   └── App.jsx                      # Main React application
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 6. How to Run the Application

### Step 1: Start the Backend (FastAPI)
```bash
cd /Users/sravanthikalavakunta/Desktop/agentic_ai_project/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive API Docs (Swagger): `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/health`

### Step 2: Start the Frontend (React + Vite)
In a separate terminal window:
```bash
cd /Users/sravanthikalavakunta/Desktop/agentic_ai_project/frontend
npm run dev
```
- Frontend Dashboard: `http://localhost:5173`

---

## 7. Running Backend Tests

Run the complete 22-test integration suite:
```bash
cd /Users/sravanthikalavakunta/Desktop/agentic_ai_project/backend
source venv/bin/activate
pytest tests/ -v
```

**Verification Output**:
```text
tests/test_agent.py::test_langgraph_energy_agent_execution PASSED
tests/test_analytics.py::test_kpi_calculations_with_synthetic_data PASSED
tests/test_analytics.py::test_distribution_breakdown PASSED
tests/test_anomaly.py::test_anomaly_detection_pipeline_and_accuracy PASSED
tests/test_anomaly.py::test_anomaly_severity_and_explanation PASSED
tests/test_api.py::test_health_endpoint PASSED
tests/test_api.py::test_facilities_endpoint PASSED
tests/test_api.py::test_energy_summary_endpoint PASSED
tests/test_api.py::test_energy_consumption_endpoint PASSED
tests/test_api.py::test_energy_distribution_endpoint PASSED
tests/test_api.py::test_anomalies_endpoint PASSED
tests/test_api.py::test_recommendations_endpoint PASSED
tests/test_api.py::test_forecast_endpoint PASSED
tests/test_api.py::test_agent_analyze_endpoint PASSED
tests/test_maintenance.py::test_asset_seeding_and_kpis PASSED
tests/test_maintenance.py::test_health_scoring_and_penalties PASSED
tests/test_maintenance.py::test_sensor_refresh_simulation PASSED
tests/test_maintenance.py::test_predictive_maintenance_agent_execution PASSED
tests/test_maintenance.py::test_maintenance_alerts_lifecycle PASSED
tests/test_maintenance.py::test_maintenance_schedule_work_orders PASSED
tests/test_maintenance.py::test_work_order_completion_restores_health PASSED
tests/test_maintenance.py::test_maintenance_api_endpoints PASSED

======================== 22 passed in 90.48s =========================
```

---

## 8. Predictive Maintenance Highlights

1. **Equipment Asset Catalog**:
   - 17 realistic industrial assets modeled across `FAC-001` and `FAC-002` across all levels (Basement, Floors 1–4, Rooftop).
   - Equipment categories: Centrifugal Chillers, Air Handling Units (AHUs), Cooling Towers, Primary/Secondary Pumps, Induction Motors, Standby Generators, Traction Elevators, Main Switchgear Panels.
2. **Physics & ISO 10816 Health Scoring (0–100)**:
   - Evaluates temperature deviations against thermal limits.
   - Vibration severity evaluated against ISO 10816 Class I–IV velocity limits.
   - Operating pressure deltas evaluated against hydraulic envelopes.
   - Cumulative runtime hours evaluated against manufacturer service intervals.
   - Overdue maintenance intervals penalize score and raise alerts.
3. **Failure Risk & Remaining Useful Life (RUL)**:
   - Calculates failure probability ($0 - 100\%$) and estimated days to failure.
   - Provides clear engineering explanations and abnormal sensor readings breakdown.
4. **Interactive Work Orders & Health Restoration**:
   - Create, assign, and track work orders with assigned certified technicians.
   - Completing a work order resets runtime hours since service, resolves active alerts, and restores asset health score.
5. **Simulate IoT Telemetry Stream**:
   - Click "Simulate Sensor Stream" in Top Navigation or Asset Monitoring page to cycle real-time physics telemetry across the entire fleet and trigger dynamic alert updates.
