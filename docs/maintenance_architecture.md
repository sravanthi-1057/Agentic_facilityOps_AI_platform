# Milestone 2: Predictive Maintenance System Architecture

The **Predictive Maintenance System** expands the Agentic FacilityOps platform by delivering continuous health diagnostics, remaining useful life (RUL) estimation, and automated work order scheduling across critical physical facility equipment.

---

## 1. System Architecture

```
Physical Facility Equipment / IoT Sensors (Chillers, AHUs, Pumps, Motors, Generators)
                                    │
                                    ▼
                     FastAPI Maintenance Subsystem
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
               Asset Simulator            Database Layer
            (Physical Sensor Stream)   (MySQL & MongoDB)
                       │                         │
                       └────────────┬────────────┘
                                    │
                                    ▼
                LangGraph Maintenance AI Agent (7 Nodes)
         ┌────────────────────────────────────────────────────────┐
         │ 1. Asset & Telemetry Validation Node                   │
         │ 2. Sensor Condition & Physics Analysis Node            │
         │ 3. Multi-Factor Equipment Health Scoring (0–100)       │
         │ 4. Predictive Failure Risk & RUL Engine                │
         │ 5. Prescriptive Maintenance Recommendation Generator   │
         │ 6. Alert & Threshold Evaluator Node                    │
         │ 7. Relational & DocStore Persistence Node              │
         └────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        FastAPI REST API Layer
                                    │
                                    ▼
             React + Vite Enterprise Maintenance Dashboard
   ┌──────────────────────────────────────────────────────────────────┐
   │ • Equipment Fleet Overview & Asset Health Cards                  │
   │ • Interactive Asset Telemetry Gauges & Historical Charts         │
   │ • Failure Risk Breakdown & Prescriptive Action Cards             │
   │ • Maintenance Alerts Management (Acknowledge / Resolve)          │
   │ • Work Order Dispatch & Completed Maintenance Lifecycle          │
   └──────────────────────────────────────────────────────────────────┘
```

---

## 2. Monitored Equipment Catalog & Physical Telemetry

The platform monitors critical HVAC, electrical, and mechanical assets across facilities:

| Asset Category | Monitored Units | Core Physical Parameters | ISO / Engineering Standard |
|---|---|---|---|
| **Chillers** | Water-cooled Centrifugal, Air-cooled Screw | Temp (°C), Vibration (mm/s), Condenser / Chilled Water Pressure (PSI), Power (kW) | ISO 10816-3 Group 1 (Rigid Foundation) |
| **AHU (Air Handling Units)** | Supply & Return Fans, Filter Banks | Static Air Pressure (PSI), Motor Vibration (mm/s), Air Temp (°C), Power (kW) | AMCA 210, ISO 10816-3 Group 2 |
| **Cooling Towers** | Induced Draft Axial Fans | Fan Vibration (mm/s), Basin Temp (°C), Water Circulation Pressure (PSI) | CTI STD-201 |
| **Pumps** | Chilled Water Primary/Secondary, Condenser Pumps | Casing Vibration (mm/s), Head Discharge Pressure (PSI), Bearing Temp (°C) | Hydraulic Institute (HI) 9.6.4 |
| **Motors** | Compressor & Fan Induction Motors | Stator Temp (°C), Bearing Velocity Vibration (mm/s), Power Draw (kW) | NEMA MG 1, ISO 10816-1 |
| **Generators** | Standby Diesel Generators | Jacket Water Temp (°C), Lube Oil Pressure (PSI), Frequency & kW Load | ISO 8528 |
| **Elevators** | Passenger Traction Elevators | Drive Motor Vibration (mm/s), Hoist Motor Temp (°C), Brake Assembly Load | ASME A17.1 |
| **Electrical Panels** | Main Distribution & Switchgear | Busbar Temp (°C), Infrared Delta-T, Load Current & Harmonics | NFPA 70B, NETA MTS |

---

## 3. Equipment Health Scoring Algorithm (0–100)

Health scores are dynamically computed from sensor telemetry and operational history using a multi-factor penalty deduction model:

$$\text{Health Score} = \max\left(0, \; 100 - (\Delta_{\text{temp}} + \Delta_{\text{vib}} + \Delta_{\text{press}} + \Delta_{\text{runtime}} + \Delta_{\text{maint}})\right)$$

### Contributing Factor Penalties:
1. **Temperature Penalty ($\Delta_{\text{temp}}$)**:
   - Evaluates deviation above asset nominal operating ceiling.
   - Normal ($< 5^\circ\text{C}$ delta): 0 pts
   - Warning ($5^\circ\text{C} - 15^\circ\text{C}$ delta): 5–15 pts
   - Critical ($> 15^\circ\text{C}$ delta): 25–40 pts
2. **Vibration Severity Penalty ($\Delta_{\text{vib}}$)**:
   - Grounded in **ISO 10816 Vibration Severity Standards**:
     - *Zone A/B (Good/Acceptable)*: $\le 2.8\text{ mm/s}$ $\rightarrow 0$ pts
     - *Zone C (Warning / Unsatisfactory)*: $2.8 - 4.5\text{ mm/s}$ $\rightarrow 10 - 20$ pts
     - *Zone D (Critical / Unacceptable)*: $> 4.5\text{ mm/s}$ $\rightarrow 30 - 45$ pts
3. **Pressure Abnormality Penalty ($\Delta_{\text{press}}$)**:
   - Evaluates deviation from suction/discharge pressure envelopes: 5–20 pts
4. **Runtime Service Interval Penalty ($\Delta_{\text{runtime}}$)**:
   - Operating hours since last overhaul vs. manufacturer recommendation: 5–15 pts
5. **Overdue Maintenance Penalty ($\Delta_{\text{maint}}$)**:
   - Penalty applied when days since last service exceed scheduled interval: 10–25 pts

### Health Classification:
- **90–100**: *Excellent* (Asset performing within optimal baseline)
- **75–89**: *Good* (Normal minor wear, no operational risk)
- **60–74**: *Warning* (Early degradation detected, schedule routine inspection)
- **40–59**: *Poor / Degraded* (Substantial degradation, corrective action required)
- **0–39**: *Critical* (High risk of imminent mechanical or electrical failure)

---

## 4. Failure Risk & Remaining Useful Life (RUL) Engine

The predictive model estimates failure probability ($P_{\text{fail}} \in [0, 100\%]$) and Remaining Useful Life (days):

$$P_{\text{fail}} = \min\left(100, \; (100 - \text{Health Score}) \times 1.15 + \kappa_{\text{vibration\_factor}}\right)$$

$$\text{Estimated Days to Failure (RUL)} = \begin{cases} 
3 - 7 \text{ days} & \text{if } P_{\text{fail}} \ge 75\% \\
8 - 20 \text{ days} & \text{if } 50\% \le P_{\text{fail}} < 75\% \\
21 - 45 \text{ days} & \text{if } 25\% \le P_{\text{fail}} < 50\% \\
46 - 90 \text{ days} & \text{if } P_{\text{fail}} < 25\%
\end{cases}$$

---

## 5. LangGraph Maintenance Agent Workflow

The Maintenance AI Agent is compiled as a cyclical state machine using **LangGraph**:

1. **Validation Node**: Ingests active equipment records and validates sensor telemetry completeness.
2. **Condition Analysis Node**: Calculates telemetry deltas against ISO 10816 envelopes and identifies physical anomalies.
3. **Health Scoring Node**: Computes dynamic 0–100 scores and contributing factor penalty breakdowns.
4. **Failure Risk Prediction Node**: Computes failure probability percentage and estimates RUL countdown in days.
5. **Recommendation Node**: Synthesizes engineering explanations and prescriptive maintenance actions.
6. **Alert Generation Node**: Deduplicates and dispatches severity-rated alerts (`Critical`, `High`, `Medium`, `Low`).
7. **Persistence Node**: Atomically commits updates to SQL and appends audit execution traces to MongoDB/DocStore.

---

## 6. Work Order Lifecycle & Health Restoration

When maintenance work orders are completed in the dashboard:
1. The technician logs root-cause notes and replaced parts.
2. The backend sets `status = 'Completed'` and timestamps `completed_date`.
3. The asset's `last_maintenance_date` is updated to current timestamp.
4. Runtime hours accumulated since maintenance are reset.
5. Health scores are restored and active alerts for the asset are resolved.
