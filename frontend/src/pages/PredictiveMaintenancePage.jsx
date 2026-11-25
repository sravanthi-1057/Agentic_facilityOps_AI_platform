import React, { useState } from 'react';
import { 
  Wrench, 
  ShieldAlert, 
  CalendarClock, 
  Clock, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Plus, 
  Activity,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function PredictiveMaintenancePage({
  predictions = [],
  assets = [],
  onOpenCreateSchedule,
  onSelectAsset,
  onRunMaintenanceAgent
}) {
  const [filterRisk, setFilterRisk] = useState('all');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const getRisk = (p) => (p?.risk_level || 'Low').toLowerCase();

  const filtered = predictions.filter((p) => {
    if (filterRisk === 'all') return true;
    return getRisk(p) === filterRisk.toLowerCase();
  });

  const criticalCount = predictions.filter((p) => getRisk(p) === 'critical').length;
  const highCount = predictions.filter((p) => getRisk(p) === 'high').length;
  const mediumCount = predictions.filter((p) => getRisk(p) === 'medium').length;
  const lowCount = predictions.filter((p) => getRisk(p) === 'low').length;

  const handleReevaluate = async () => {
    setIsEvaluating(true);
    try {
      if (onRunMaintenanceAgent) {
        await onRunMaintenanceAgent();
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const getTimeframe = (item) => {
    const days = item.estimated_days_to_failure ?? item.predicted_failure_days ?? 30;
    if (days <= 7) return `Within ${days} days (Immediate Action)`;
    if (days <= 21) return `Within ${days} days (High Priority)`;
    if (days <= 60) return `Estimated ${days} days (Scheduled Service)`;
    return `> ${days} days (Normal Lifecycle)`;
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            Predictive Maintenance & Failure Prevention Engine
          </div>
          <h2 className="text-xl font-bold tracking-tight">Prescriptive Failure Diagnostics & RUL Forecasts</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Proactively identifies bearing spalling, tube fouling, impeller cavitation, and filter clogs before catastrophic operational outages.
          </p>
        </div>
        <button
          onClick={handleReevaluate}
          disabled={isEvaluating}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all self-start md:self-auto shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Activity className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
          <span>{isEvaluating ? 'Evaluating...' : 'Re-evaluate Fleet Failure Risks'}</span>
        </button>
      </div>

      {/* Metric Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setFilterRisk('all')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filterRisk === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Total Predictions</div>
          <div className="text-xl font-bold mt-0.5">{predictions.length}</div>
        </button>

        <button
          onClick={() => setFilterRisk('critical')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filterRisk === 'critical'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Critical Risk (&gt;70%)</div>
          <div className="text-xl font-bold mt-0.5">{criticalCount}</div>
        </button>

        <button
          onClick={() => setFilterRisk('high')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filterRisk === 'high'
              ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
              : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50/50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">High Risk (35–69%)</div>
          <div className="text-xl font-bold mt-0.5">{highCount}</div>
        </button>

        <button
          onClick={() => setFilterRisk('medium')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filterRisk === 'medium'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Medium Risk (15–34%)</div>
          <div className="text-xl font-bold mt-0.5">{mediumCount}</div>
        </button>

        <button
          onClick={() => setFilterRisk('low')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filterRisk === 'low'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Low Risk (&lt;15%)</div>
          <div className="text-xl font-bold mt-0.5">{lowCount}</div>
        </button>
      </div>

      {/* Predictions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200">
            <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No predictive failure risks found matching this filter.</p>
            <p className="text-xs text-slate-400 mt-1">Select another filter or re-evaluate fleet failure risks.</p>
          </div>
        ) : (
          filtered.map((item, idx) => {
            const assetObj = assets.find((a) => a.asset_id === item.asset_id);
            const assetName = item.asset_name || assetObj?.asset_name || item.asset_id;
            const facility = item.facility_id || assetObj?.facility_id || 'FAC-001';
            const floor = item.floor || assetObj?.floor || 'Floor 1';
            const healthScore = item.health_score ?? (assetObj?.health_score ?? 100);
            const failureRiskPct = item.failure_risk_pct ?? (assetObj?.failure_risk_pct ?? 0);
            const daysToFailure = item.estimated_days_to_failure ?? item.predicted_failure_days ?? 30;
            const riskLevel = item.risk_level || 'Low';
            const timeframe = getTimeframe(item);
            const reason = item.reason || item.diagnosis || 'Asset operating within safe engineering thresholds.';
            const recommendation = item.recommendation || item.suggested_action || 'Continue standard monitoring protocol.';

            return (
              <div
                key={item.prediction_id || item.id || idx}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {assetName}
                      </h3>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {item.asset_id} • {facility} ({floor})
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                        riskLevel.toLowerCase() === 'critical'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : riskLevel.toLowerCase() === 'high'
                          ? 'bg-orange-100 text-orange-800 border-orange-200'
                          : riskLevel.toLowerCase() === 'medium'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {riskLevel} Risk
                    </span>
                  </div>

                  {/* Failure Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/80 my-3 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Health Score</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{healthScore}/100</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Failure Risk</div>
                      <div className={`text-sm font-bold mt-0.5 ${failureRiskPct >= 50 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {failureRiskPct}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Estimated RUL</div>
                      <div className="text-sm font-bold text-indigo-700 mt-0.5">{daysToFailure} days</div>
                    </div>
                  </div>

                  {/* Predicted Timeframe */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-2 font-medium">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Timeframe: <strong className="text-slate-800">{timeframe}</strong></span>
                  </div>

                  {/* Diagnostic Rationale */}
                  <div className="text-xs text-slate-600 leading-relaxed mb-3">
                    <span className="font-semibold text-slate-800">Diagnostic Reason: </span>
                    {reason}
                  </div>

                  {/* Recommended Action */}
                  <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs text-indigo-950 mb-4">
                    <span className="font-bold text-indigo-900">Recommended Action: </span>
                    <span className="text-indigo-800">{recommendation}</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onSelectAsset && onSelectAsset(item.asset_id)}
                    className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    View Asset Telemetry →
                  </button>
                  <button
                    onClick={() => onOpenCreateSchedule && onOpenCreateSchedule(item.asset_id)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Create Work Order</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
