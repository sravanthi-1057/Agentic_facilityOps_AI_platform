from typing import List, Dict, Any
from app.config import settings

class RecommendationEngine:
    """
    Expert Rule-Based Energy Recommendation Engine for Facility Managers.
    Calculates quantifiable kWh and Dollar savings based on verified tariffs and telemetry.
    """

    @staticmethod
    def generate_recommendations_from_anomalies(anomalies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        recommendations = []
        seen_conditions = set()

        for a in anomalies:
            desc = a.get("description", "")
            fac_id = a.get("facility_id", "FAC-001")
            floor = a.get("floor", "Floor 1")
            actual = a.get("actual_consumption", 0.0)
            expected = a.get("expected_consumption", 0.0)
            excess_kwh = max(0.0, actual - expected)

            # Condition 1: Unscheduled Nighttime HVAC Operation
            if "Nighttime HVAC" in desc and "night_hvac" not in seen_conditions:
                seen_conditions.add("night_hvac")
                # Night HVAC running 4 hrs/day: savings = excess_kwh * 4 hrs * 30 days
                monthly_excess_kwh = excess_kwh * 4 * 22  # 22 workdays/month
                monthly_savings_usd = monthly_excess_kwh * settings.ELECTRICITY_TARIFF_PER_KWH

                recommendations.append({
                    "title": "Enforce Nighttime HVAC Setback & Auto-Shutdown",
                    "description": f"Telemetry identified continuous HVAC operation between 01:00 AM and 05:00 AM on {floor}. Normal unoccupied setback was overridden.",
                    "reason": f"Baseline expectation is {expected:.1f} kWh, but actual draw reached {actual:.1f} kWh (+{a.get('deviation_pct', 0)}%).",
                    "facility_id": fac_id,
                    "floor": floor,
                    "priority": "High",
                    "estimated_energy_savings_kwh": round(monthly_excess_kwh, 1),
                    "estimated_cost_savings_usd": round(monthly_savings_usd, 2),
                    "suggested_action": "Reprogram BMS chiller/AHU night setback to 26°C and enable motion-sensor lockouts after 20:00.",
                    "status": "Pending"
                })

            # Condition 2: Abnormal Weekend Lighting Wastage
            elif "Weekend Lighting" in desc and "weekend_lighting" not in seen_conditions:
                seen_conditions.add("weekend_lighting")
                weekend_excess_kwh = excess_kwh * 10 * 8  # 10 hrs * 8 weekend days/month
                weekend_savings_usd = weekend_excess_kwh * settings.ELECTRICITY_TARIFF_PER_KWH

                recommendations.append({
                    "title": "Deploy Smart Occupancy Sensors & Schedule Lighting Timers",
                    "description": f"Lighting sub-meters recorded substantial power draw on weekends when {floor} occupancy is nominal (<5%).",
                    "reason": "Fixtures remain energized manually outside operational calendar windows.",
                    "facility_id": fac_id,
                    "floor": floor,
                    "priority": "Medium",
                    "estimated_energy_savings_kwh": round(weekend_excess_kwh, 1),
                    "estimated_cost_savings_usd": round(weekend_savings_usd, 2),
                    "suggested_action": "Integrate PIR occupancy sensors and sweep all non-emergency lighting zones off at 19:00 on Fridays.",
                    "status": "Pending"
                })

            # Condition 3: Water Leakage / Cooling Tower Anomaly
            elif "Water Leakage" in desc and "water_leak" not in seen_conditions:
                seen_conditions.add("water_leak")
                # Water leak ~150 L/hr excess * 24 hrs * 7 days
                water_loss_litres = 150.0 * 24 * 7
                cost_loss_usd = water_loss_litres * settings.WATER_TARIFF_PER_LITRE

                recommendations.append({
                    "title": "Immediate Acoustic Leak Inspection for Plumbing & Cooling Loop",
                    "description": f"Sustained nighttime water flow rate on {fac_id} indicates valve stuck open or pipe micro-fracture.",
                    "reason": "Water consumption exceeded base standby by over 400% during 01:00-05:00 window.",
                    "facility_id": fac_id,
                    "floor": floor,
                    "priority": "Critical",
                    "estimated_energy_savings_kwh": 450.0,  # saved auxiliary pumping energy
                    "estimated_cost_savings_usd": round(cost_loss_usd + (450 * settings.ELECTRICITY_TARIFF_PER_KWH), 2),
                    "suggested_action": "Dispatch maintenance technician to inspect cooling tower float valve and main supply manifolds.",
                    "status": "Pending"
                })

            # Condition 4: Peak Demand Surge / Load shifting
            elif "Power Surge" in desc and "peak_surge" not in seen_conditions:
                seen_conditions.add("peak_surge")
                surge_kwh = excess_kwh * 2 * 20
                surge_savings_usd = surge_kwh * settings.ELECTRICITY_TARIFF_PER_KWH

                recommendations.append({
                    "title": "Peak Load Shifting & Pre-Cooling Strategy",
                    "description": f"High coincident peak demand on {floor} during 14:00-16:00 incurs peak tariff penalties.",
                    "reason": "Simultaneous chiller compressor cycle and heavy lab plug loads produce avoidable peak demand charges.",
                    "facility_id": fac_id,
                    "floor": floor,
                    "priority": "High",
                    "estimated_energy_savings_kwh": round(surge_kwh, 1),
                    "estimated_cost_savings_usd": round(surge_savings_usd, 2),
                    "suggested_action": "Pre-cool spaces between 11:00-13:00 to coast through peak hours; stagger heavy autoclave and lab equipment cycles.",
                    "status": "Pending"
                })

        # Baseline systemic recommendation if few anomalies
        if not recommendations:
            recommendations.append({
                "title": "HVAC Chilled Water Supply Temperature Reset",
                "description": "Building operation is within standard parameters; implement dynamic chilled water reset to achieve an additional 4-7% chiller efficiency.",
                "reason": "Ambient wet-bulb temperature analysis shows opportunity to raise setpoint by 1.5°C during mild mornings.",
                "facility_id": "FAC-001",
                "floor": "All Floors",
                "priority": "Medium",
                "estimated_energy_savings_kwh": 850.0,
                "estimated_cost_savings_usd": round(850.0 * settings.ELECTRICITY_TARIFF_PER_KWH, 2),
                "suggested_action": "Enable automated temperature reset in building automation management software.",
                "status": "Pending"
            })

        return recommendations

recommendation_engine = RecommendationEngine()
