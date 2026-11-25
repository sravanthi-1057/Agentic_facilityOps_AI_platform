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
  CheckCheck,
  CalendarClock
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

  const getSev = (a) => (a?.severity || 'Low').toLowerCase();
  const getStat = (a) => (a?.status || 'NEW').toUpperCase();

  const filtered = alerts.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q) ||
      (a.asset_name || '').toLowerCase().includes(q) ||
      (a.asset_id || '').toLowerCase().includes(q);
    const matchesSev = selectedSeverity === 'all' || getSev(a) === selectedSeverity.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || getStat(a) === selectedStatus.toUpperCase();
    return matchesSearch && matchesSev && matchesStatus;
  });

  const handleAcknowledge = async (alertId) => {
    setActionLoadingId(alertId);
    try {
      await api.acknowledgeAlert(alertId);
      if (onReloadAlerts) await onReloadAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      alert('Failed to acknowledge alert: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolve = async (alertId) => {
    setActionLoadingId(alertId);
    try {
      await api.resolveAlert(alertId);
      if (onReloadAlerts) await onReloadAlerts();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      alert('Failed to resolve alert: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  const counts = {
    total: alerts.length,
    critical: alerts.filter((a) => getSev(a) === 'critical').length,
    high: alerts.filter((a) => getSev(a) === 'high').length,
    medium: alerts.filter((a) => getSev(a) === 'medium').length,
    low: alerts.filter((a) => getSev(a) === 'low').length,
    newAlerts: alerts.filter((a) => getStat(a) === 'NEW').length,
    acknowledged: alerts.filter((a) => getStat(a) === 'ACKNOWLEDGED').length,
    resolved: alerts.filter((a) => getStat(a) === 'RESOLVED').length
  };

  const parseSensorReadings = (readingsStr) => {
    if (!readingsStr) return null;
    try {
      return typeof readingsStr === 'string' ? JSON.parse(readingsStr) : readingsStr;
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
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
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
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
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
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
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
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedSeverity === 'medium'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Medium / Advisory</div>
          <div className="text-xl font-bold mt-0.5">{counts.medium + counts.low}</div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-semibold mr-1">Status:</span>
          {['all', 'NEW', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts, assets, telemetry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64"
          />
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Alert Description</th>
                <th className="py-3 px-4">Asset & Location</th>
                <th className="py-3 px-4">Sensor Readings</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No maintenance alerts matching the active filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const alertId = item.alert_id || item.id;
                  const sensors = parseSensorReadings(item.sensor_readings);
                  const isCritical = getSev(item) === 'critical';
                  const isHigh = getSev(item) === 'high';
                  const isResolved = getStat(item) === 'RESOLVED';
                  const isNew = getStat(item) === 'NEW';

                  return (
                    <tr key={alertId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : isHigh
                              ? 'bg-orange-100 text-orange-800 border-orange-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug">{item.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {item.description}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {item.created_at ? item.created_at.replace('T', ' ').slice(0, 16) : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onSelectAsset && onSelectAsset(item.asset_id)}
                          className="font-semibold text-slate-800 hover:text-indigo-600 text-left block cursor-pointer"
                        >
                          {item.asset_name || item.asset_id}
                        </button>
                        <div className="text-[10px] text-slate-500">
                          {item.asset_id} • {item.facility_id} ({item.floor})
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {sensors ? (
                          <div className="space-y-0.5 text-[10px] font-mono text-slate-600">
                            {sensors.temperature !== undefined && (
                              <div>Temp: <strong className="text-slate-800">{sensors.temperature}°C</strong></div>
                            )}
                            {sensors.vibration !== undefined && (
                              <div>Vib: <strong className="text-slate-800">{sensors.vibration} mm/s</strong></div>
                            )}
                            {sensors.pressure !== undefined && (
                              <div>Press: <strong className="text-slate-800">{sensors.pressure} PSI</strong></div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Telemetry logged</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          {item.recommended_action}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : item.status === 'ACKNOWLEDGED'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {isNew && (
                          <button
                            onClick={() => handleAcknowledge(alertId)}
                            disabled={actionLoadingId === alertId}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Ack</span>
                          </button>
                        )}

                        {!isResolved && (
                          <button
                            onClick={() => handleResolve(alertId)}
                            disabled={actionLoadingId === alertId}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Resolve</span>
                          </button>
                        )}

                        {onOpenCreateSchedule && (
                          <button
                            onClick={() => onOpenCreateSchedule(item.asset_id)}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 p-1 rounded-lg transition-colors cursor-pointer"
                            title="Create Work Order"
                          >
                            <CalendarClock className="w-4 h-4 text-indigo-600" />
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
