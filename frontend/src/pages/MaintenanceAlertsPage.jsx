import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Wrench,
  Check,
  CheckCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function MaintenanceAlertsPage({
  alerts = [],
  onReloadAlerts,
  onOpenCreateSchedule,
  onSelectAsset
}) {
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const filtered = alerts.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.asset_id.toLowerCase().includes(q);
    const matchesSev = selectedSeverity === 'all' || a.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || a.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesSev && matchesStatus;
  });

  const handleAcknowledge = async (alertId) => {
    setActionLoadingId(alertId);
    try {
      await api.acknowledgeAlert(alertId);
      if (onReloadAlerts) onReloadAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolve = async (alertId) => {
    setActionLoadingId(alertId);
    try {
      await api.resolveAlert(alertId);
      if (onReloadAlerts) onReloadAlerts();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const counts = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'Critical').length,
    high: alerts.filter(a => a.severity === 'High').length,
    medium: alerts.filter(a => a.severity === 'Medium').length,
    newAlerts: alerts.filter(a => a.status === 'NEW').length,
    acknowledged: alerts.filter(a => a.status === 'ACKNOWLEDGED').length,
    resolved: alerts.filter(a => a.status === 'RESOLVED').length
  };

  const parseSensorReadings = (readingsStr) => {
    if (!readingsStr) return null;
    try {
      return JSON.parse(readingsStr);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Predictive Maintenance Alerts & Incident Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active condition thresholds, sensor breaches, and equipment degradation notifications
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Unresolved Open Incidents:</span>
          <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-md border border-rose-200">
            {counts.newAlerts + counts.acknowledged} Open
          </span>
        </div>
      </div>

      {/* Severity Filter Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedSeverity('all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedSeverity === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">All Severities</div>
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
          <div className="text-[11px] font-medium opacity-80">Critical Breaches</div>
          <div className="text-xl font-bold mt-0.5">{counts.critical}</div>
        </button>

        <button
          onClick={() => setSelectedSeverity('high')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedSeverity === 'high'
              ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
              : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50/50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">High Severity</div>
          <div className="text-xl font-bold mt-0.5">{counts.high}</div>
        </button>

        <button
          onClick={() => setSelectedSeverity('medium')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedSeverity === 'medium'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Medium Severity</div>
          <div className="text-xl font-bold mt-0.5">{counts.medium}</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts by title, description, or asset ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <span className="font-semibold text-slate-500 mr-1">Status:</span>
          {['all', 'new', 'acknowledged', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/80">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Alert Title & Explanation</th>
                <th className="py-3 px-4">Asset & Location</th>
                <th className="py-3 px-4">Sensor Telemetry at Alert</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No alerts found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const sensors = parseSensorReadings(item.sensor_readings);

                  return (
                    <tr key={item.alert_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            item.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : item.severity === 'High'
                              ? 'bg-orange-100 text-orange-800 border-orange-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {item.description}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {item.created_at ? item.created_at.replace('T', ' ').slice(0, 16) : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onSelectAsset(item.asset_id)}
                          className="font-semibold text-slate-800 hover:text-indigo-600 text-left block"
                        >
                          {item.asset_id}
                        </button>
                        <div className="text-[10px] text-slate-500">{item.facility_id} • {item.floor}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {sensors ? (
                          <div className="space-y-0.5 text-[10px] font-mono text-slate-600">
                            {sensors.temperature && <div>Temp: <strong className="text-slate-800">{sensors.temperature}°C</strong></div>}
                            {sensors.vibration && <div>Vib: <strong className="text-slate-800">{sensors.vibration} mm/s</strong></div>}
                            {sensors.pressure && <div>Press: <strong className="text-slate-800">{sensors.pressure} PSI</strong></div>}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sensor metrics logged</span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                          {item.recommended_action}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'ACKNOWLEDGED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800 animate-pulse'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {item.status === 'NEW' && (
                          <button
                            onClick={() => handleAcknowledge(item.alert_id)}
                            disabled={actionLoadingId === item.alert_id}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded text-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Ack</span>
                          </button>
                        )}
                        {item.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolve(item.alert_id)}
                            disabled={actionLoadingId === item.alert_id}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded text-xs shadow-xs transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Resolve</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
