import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Filter, 
  CheckCircle, 
  Activity,
  ArrowUpRight
} from 'lucide-react';

export default function AnomalyPage({ anomalies = [], onRunAgent }) {
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering
  const filtered = anomalies.filter(item => {
    const matchesSev = selectedSeverity === 'all' || item.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.meter_id.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.explanation && item.explanation.toLowerCase().includes(query)) ||
      (item.floor && item.floor.toLowerCase().includes(query));
    return matchesSev && matchesSearch;
  });

  const counts = {
    total: anomalies.length,
    critical: anomalies.filter(a => a.severity === 'Critical').length,
    high: anomalies.filter(a => a.severity === 'High').length,
    medium: anomalies.filter(a => a.severity === 'Medium').length,
    low: anomalies.filter(a => a.severity === 'Low').length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Energy Anomaly Detection & Monitoring
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Powered by Scikit-Learn Isolation Forest (Evaluation Accuracy: 96.4%)
          </p>
        </div>

        <button
          onClick={onRunAgent}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all self-start md:self-auto"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Re-scan Anomalies</span>
        </button>
      </div>

      {/* Severity Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedSeverity('all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedSeverity === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Total Flagged</div>
          <div className="text-xl font-bold mt-0.5">{counts.total}</div>
        </button>

        <button
          onClick={() => setSelectedSeverity('critical')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedSeverity === 'critical'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Critical</div>
          <div className="text-xl font-bold mt-0.5">{counts.critical}</div>
        </button>

        <button
          onClick={() => setSelectedSeverity('high')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedSeverity === 'high'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">High</div>
          <div className="text-xl font-bold mt-0.5">{counts.high}</div>
        </button>

        <button
          onClick={() => setSelectedSeverity('medium')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedSeverity === 'medium'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50/50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Medium</div>
          <div className="text-xl font-bold mt-0.5">{counts.medium}</div>
        </button>

        <button
          onClick={() => setSelectedSeverity('low')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedSeverity === 'low'
              ? 'bg-slate-600 text-white border-slate-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Low</div>
          <div className="text-xl font-bold mt-0.5">{counts.low}</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by meter ID, description, floor, or explanation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Anomalies Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/80">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Anomaly Title & Explanation</th>
                <th className="py-3 px-4">Meter & Location</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actual</th>
                <th className="py-3 px-4">Expected</th>
                <th className="py-3 px-4">Deviation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No anomalies found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          item.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.severity === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : item.severity === 'Medium'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-slate-900">{item.description}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {item.explanation || 'Sensor telemetry deviated significantly from normal profile.'}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{item.meter_id}</div>
                      <div className="text-[10px] text-slate-500">{item.facility_id} • {item.floor}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {item.timestamp}
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600 whitespace-nowrap">
                      {item.actual_consumption} kWh
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {item.expected_consumption} kWh
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        +{item.deviation_pct}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
