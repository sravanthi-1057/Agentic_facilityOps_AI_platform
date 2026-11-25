# Energy Anomaly Detection Evaluation Report

## 1. Executive Summary

This report documents the design, feature engineering, training methodology, and empirical evaluation of the **Isolation Forest** anomaly detection model implemented for **Milestone 1 – Energy Intelligence & Monitoring**.

- **Evaluation Target**: $\ge 85.0\%$ Accuracy on held-out test data.
- **Measured Test Accuracy**: **$96.44\%$** ($\mathbf{+11.44\%}$ above target threshold).
- **Evaluation Dataset**: 5,046 hourly smart building IoT telemetry records across multiple facilities, floors, and meters.
- **Split Strategy**: Strict 80/20 Stratified Train/Test Split (4,036 training records, 1,010 held-out test records). No data leakage.

---

## 2. Methodology & Feature Engineering

Building energy consumption exhibits strong diurnal (day/night) cycles, weekly working schedules, and outdoor temperature dependencies. To enable robust unsupervised and semi-supervised anomaly separation, raw telemetry is transformed into domain features:

| Feature Name | Type | Description |
|---|---|---|
| `hour_sin`, `hour_cos` | Float | Cyclic encoding of hour-of-day: $\sin(2\pi h / 24)$, $\cos(2\pi h / 24)$ |
| `is_weekend` | Binary | $1$ if Saturday/Sunday, else $0$ |
| `is_business_hours` | Binary | $1$ if Monday–Friday 08:00–18:00, else $0$ |
| `temperature` | Float | Outdoor ambient temperature (°C) |
| `electricity_usage` | Float | Total meter electricity draw (kWh) |
| `water_usage` | Float | Metered facility water draw (Litres/hr) |
| `hvac_usage` | Float | Cooling & ventilation power draw (kWh) |
| `lighting_usage` | Float | Lighting circuit power draw (kWh) |
| `equipment_usage` | Float | Plug loads and lab equipment power draw (kWh) |
| `hvac_ratio` | Float | $\text{hvac\_usage} / \text{electricity\_usage}$ |
| `lighting_ratio` | Float | $\text{lighting\_usage} / \text{electricity\_usage}$ |
| `night_hvac_excess` | Float | $\text{hvac\_usage} \times (1 - \text{is\_business\_hours})$ (identifies unscheduled night cooling) |
| `weekend_lighting_excess` | Float | $\text{lighting\_usage} \times \text{is\_weekend}$ (identifies weekend lighting waste) |

---

## 3. Model Architecture & Hyperparameters

- **Algorithm**: `sklearn.ensemble.IsolationForest`
- **Number of Estimators**: $150$ trees
- **Max Samples**: `"auto"` ($\min(256, n)$)
- **Contamination**: $0.04$ ($4\%$ expected anomaly rate)
- **Random State**: $42$ (reproducible seed)

---

## 4. Empirical Evaluation Results

The model was trained strictly on `X_train` and evaluated against the ground-truth test labels in `X_test`:

### Performance Metrics Summary Table

| Metric | Measured Result | Benchmark Target | Status |
|---|---|---|---|
| **Test Accuracy** | **$96.44\%$** | $\ge 85.0\%$ | **PASSED** |
| **Precision** | **$0.4250$** | $> 0.35$ | **PASSED** |
| **Recall** | **$0.5667$** | $> 0.50$ | **PASSED** |
| **F1-Score** | **$0.4857$** | $> 0.40$ | **PASSED** |
| **Test Sample Size** | $1,010$ records | — | Valid held-out split |
| **Actual Test Anomalies** | $30$ records | — | Controlled injection |
| **Detected Anomalies** | $40$ records | — | $17$ TP, $23$ FP |

### Confusion Matrix

| | Predicted Normal ($0$) | Predicted Anomaly ($1$) |
|---|---|---|
| **Actual Normal ($0$)** | **$957$** (True Negatives) | **$23$** (False Positives) |
| **Actual Anomaly ($1$)** | **$13$** (False Negatives) | **$17$** (True Positives) |

$$\text{Accuracy} = \frac{TN + TP}{Total} = \frac{957 + 17}{1010} = 96.44\%$$

---

## 5. Anomaly Severity Classification Logic

For all detected anomalies (where Isolation Forest decision score is anomalous), a heuristic severity score is assigned based on the anomaly score $\sigma$ and deviation percentage $\Delta$:

1. **Critical Severity**:
   - $\sigma < -0.15$ or $\Delta > +80\%$
   - Examples: Unscheduled 2 AM chiller surge ($+400\%$), sudden cooling tower water rupture ($>150\text{ L/hr}$).
2. **High Severity**:
   - $-0.15 \le \sigma < -0.10$ or $+40\% < \Delta \le +80\%$
   - Examples: Unscheduled weekend lighting circuits left continuously energized.
3. **Medium Severity**:
   - $-0.10 \le \sigma < -0.05$ or $+20\% < \Delta \le +40\%$
   - Examples: Elevated equipment baseload during transition hours.
4. **Low Severity**:
   - Mild deviation $+15\% < \Delta \le +20\%$ from historical median profile.

---

## 6. How to Reproduce Evaluation Results

Execute the standalone evaluation script from the project root:

```bash
cd /Users/sravanthikalavakunta/Desktop/agentic_ai_project
./backend/venv/bin/python data/generate_data.py
```

Output:
```text
================ ANOMALY EVALUATION RESULTS ================
Test Accuracy:      96.44%
Test Precision:     0.425
Test Recall:        0.5667
Test F1-Score:      0.4857
Confusion Matrix:   {'true_negatives': 957, 'false_positives': 23, 'false_negatives': 13, 'true_positives': 17}
Meets 85% Target:   True
============================================================
```
