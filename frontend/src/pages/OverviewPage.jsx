import React from 'react';
import { 
  Zap, 
  Droplets, 
  DollarSign, 
  Gauge, 
  AlertTriangle, 
  Leaf, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import HourlyConsumptionChart from '../charts/HourlyConsumptionChart';
import CategoryDonutChart from '../charts/CategoryDonutChart';

export default function OverviewPage({
  summary,
  hourlyData,
  distribution,
  anomalies,
  recommendations,
  onNavigateTab,
  onRunAgent
}) {
  const criticalAnomalies = (anomalies || []).filter(a => a.severity === 'Critical' || a.severity === 'High');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Milestone 1 — Energy Intelligence & Monitoring
          </div>
          <h2 className="text-xl font-bold tracking-tight">Enterprise Facility Energy Overview</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Real-time monitoring across commercial smart meters. Automated energy anomaly detection and AI-guided efficiency actions active.
          </p>
        </div>
        <button
          onClick={onRunAgent}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all self-start md:self-auto shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Execute LangGraph Agent</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Electricity Usage"
          value={summary?.total_electricity_kwh ? Number(summary.total_electricity_kwh).toLocaleString() : '0'}
          unit="kWh"
          icon={Zap}
          color="emerald"
          subtext="Total Period Consumption"
        />
        <KpiCard
          title="Water Usage"
          value={summary?.total_water_litres ? Number(summary.total_water_litres).toLocaleString() : '0'}
          unit="Litres"
          icon={Droplets}
          color="blue"
          subtext="Facility Water Draw"
        />
        <KpiCard
          title="Estimated Cost"
          value={summary?.estimated_cost_usd ? `$${Number(summary.estimated_cost_usd).toLocaleString()}` : '$0'}
          icon={DollarSign}
          color="emerald"
          subtext="$0.14/kWh + $0.004/L"
        />
        <KpiCard
          title="Efficiency Score"
          value={`${summary?.energy_efficiency_score || 85}/100`}
          icon={Gauge}
          color={summary?.energy_efficiency_score >= 80 ? 'emerald' : 'amber'}
          subtext="Load Factor & Setbacks"
        />
        <KpiCard
          title="Detected Anomalies"
          value={summary?.detected_anomalies_count || 0}
          icon={AlertTriangle}
          color="rose"
          subtext="Isolation Forest ML"
          change={criticalAnomalies.length > 0 ? `${criticalAnomalies.length} Critical` : '0 Critical'}
        />
        <KpiCard
          title="Carbon Footprint"
          value={summary?.carbon_emissions_kg ? Number(summary.carbon_emissions_kg).toLocaleString() : '0'}
          unit="kg CO2"
          icon={Leaf}
          color="violet"
          subtext="0.42 kg CO2 / kWh"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Hourly Electricity Consumption & Baseline</h3>
              <p className="text-xs text-slate-400">Measured consumption vs expected model baseline</p>
            </div>
            <button
              onClick={() => onNavigateTab('monitoring')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              <span>View Full Telemetry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <HourlyConsumptionChart data={hourlyData} />
        </div>

        {/* Subsystem Distribution Donut */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">Energy Subsystems</h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Breakdown
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">HVAC, Lighting, Equipment & Auxiliary</p>
          </div>
          <CategoryDonutChart data={distribution?.categories} />
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Primary Load: <strong className="text-slate-800">HVAC Systems</strong></span>
            <span>Tariff Rate: <strong className="text-slate-800">$0.14/kWh</strong></span>
          </div>
        </div>
      </div>

      {/* Dual Highlights: Recent Critical Anomalies & Top AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomalies Preview */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-800">Recent Critical Anomalies</h3>
            </div>
            <button
              onClick={() => onNavigateTab('anomalies')}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <span>All Anomalies ({anomalies?.length || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(anomalies || []).slice(0, 3).map((a, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{a.description}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : a.severity === 'High'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {a.severity}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">{a.explanation}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                  <span>Meter: <strong className="text-slate-700">{a.meter_id}</strong> ({a.floor})</span>
                  <span>Actual: <strong className="text-rose-600">{a.actual_consumption} kWh</strong> (vs {a.expected_consumption} kWh)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations Preview */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Top Energy Saving Recommendations</h3>
            </div>
            <button
              onClick={() => onNavigateTab('recommendations')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              <span>View All ({recommendations?.length || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(recommendations || []).slice(0, 3).map((r, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{r.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Est. Save: ${r.estimated_cost_savings_usd}/mo
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">{r.suggested_action}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100 text-[10px] text-slate-500">
                  <span>Scope: <strong className="text-slate-700">{r.floor}</strong></span>
                  <span>Energy Reduction: <strong className="text-emerald-700">{r.estimated_energy_savings_kwh} kWh</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
