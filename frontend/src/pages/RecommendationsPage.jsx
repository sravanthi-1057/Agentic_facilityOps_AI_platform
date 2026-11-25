import React, { useState } from 'react';
import { 
  Sparkles, 
  DollarSign, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  TrendingDown,
  Building2,
  Clock
} from 'lucide-react';

export default function RecommendationsPage({
  recommendations = [],
  onRunAgent
}) {
  const [selectedPriority, setSelectedPriority] = useState('all');

  const filtered = recommendations.filter(r => {
    if (selectedPriority === 'all') return true;
    return r.priority.toLowerCase() === selectedPriority.toLowerCase();
  });

  const totalKwhSavings = recommendations.reduce((acc, r) => acc + (r.estimated_energy_savings_kwh || 0), 0);
  const totalCostSavings = recommendations.reduce((acc, r) => acc + (r.estimated_cost_savings_usd || 0), 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            AI-Driven Energy Efficiency Engine
          </div>
          <h2 className="text-xl font-bold tracking-tight">Prescriptive Energy Savings & Operational Actions</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Derived by the LangGraph Energy Agent based on detected subsystem deviations, abnormal chiller cycles, and scheduling inefficiencies.
          </p>
        </div>

        {/* Aggregate Savings Pill */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 self-start md:self-auto">
          <div>
            <div className="text-[11px] text-emerald-300 font-medium uppercase">Total Potential Savings</div>
            <div className="text-xl font-bold text-white mt-0.5">${totalCostSavings.toLocaleString()}/mo</div>
            <div className="text-[10px] text-slate-300">~{totalKwhSavings.toLocaleString()} kWh/mo reduction</div>
          </div>
          <button
            onClick={onRunAgent}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Re-run Agent</span>
          </button>
        </div>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Filter Priority:</span>
        {['all', 'critical', 'high', 'medium', 'low'].map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPriority(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              selectedPriority === p
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200">
            No recommendations found for this filter.
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      item.priority === 'Critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : item.priority === 'High'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {item.priority} Priority
                  </span>
                </div>

                {/* Description & Reason */}
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {item.description}
                </p>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-700 space-y-1 mb-4">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Root Cause / Rationale:</span>
                  </div>
                  <div className="text-[11px] text-slate-600 pl-5 leading-relaxed">
                    {item.reason}
                  </div>
                </div>

                {/* Suggested Action Box */}
                <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 text-xs text-emerald-950 mb-4">
                  <span className="font-bold text-emerald-900">Recommended Operational Action: </span>
                  <span className="text-emerald-800">{item.suggested_action}</span>
                </div>
              </div>

              {/* Footer Metrics */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {item.floor}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">{item.status}</span>
                </div>

                <div className="flex items-center gap-3 font-semibold">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    -{item.estimated_energy_savings_kwh} kWh
                  </span>
                  <span className="text-slate-900 font-bold">
                    +${item.estimated_cost_savings_usd}/mo
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
