import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Activity, 
  Thermometer, 
  Gauge, 
  Zap, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function AssetDetailModal({
  isOpen,
  onClose,
  assetDetail,
  onOpenCreateSchedule,
  onAcknowledgeAlert,
  onResolveAlert
}) {
  if (!isOpen || !assetDetail) return null;

  const {
    asset_id,
    asset_name,
    asset_type,
    facility_id,
    floor,
    operational_status,
    temperature,
    vibration,
    pressure,
    power_consumption,
    runtime_hours,
    asset_age_years,
    health_score,
    failure_risk_pct,
    maintenance_priority,
    predicted_failure_days,
    contributing_factors = {},
    nominal_spec = {},
    sensor_history = [],
    alerts = [],
    schedules = [],
    latest_prediction
  } = assetDetail;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'DEGRADED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getHealthColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-rose-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">{asset_name}</h3>
                <span className="font-mono text-xs text-slate-400">({asset_id})</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(operational_status)}`}>
                  {operational_status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {asset_type} • {facility_id} ({floor}) • Age: {asset_age_years} yrs • Runtime: {Number(runtime_hours).toLocaleString()} hrs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Health & Failure Risk Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Health Score Tile */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Health Score</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-extrabold ${getHealthColor(health_score)}`}>
                  {health_score}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 100</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    health_score >= 75 ? 'bg-emerald-500' : health_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${health_score}%` }}
                />
              </div>
            </div>

            {/* Failure Risk Tile */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Predicted Failure Risk</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-extrabold ${failure_risk_pct >= 50 ? 'text-rose-600' : failure_risk_pct >= 25 ? 'text-amber-500' : 'text-emerald-600'}`}>
                  {failure_risk_pct}%
                </span>
                <span className="text-xs font-semibold uppercase text-slate-400">({maintenance_priority} Priority)</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Estimated service window: <strong className="text-slate-800">{predicted_failure_days} days</strong>
              </div>
            </div>

            {/* Contributing Factor Deductions */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Contributing Penalties</span>
              </div>
              {contributing_factors && Object.keys(contributing_factors).length > 0 ? (
                <div className="space-y-1 text-xs text-slate-600">
                  {Object.entries(contributing_factors).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[11px]">
                      <span className="capitalize text-slate-500">{k}:</span>
                      <span className="font-semibold text-rose-600">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No physical penalty deductions. Optimal state.</span>
                </div>
              )}
            </div>
          </div>

          {/* Current Live Sensor Telemetry Gauges */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Real-Time Sensor Telemetry
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Thermometer className="w-4 h-4 text-rose-500" />
                  <span>Temperature</span>
                </div>
                <div className="text-xl font-bold text-slate-900">{temperature}°C</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Nominal: {nominal_spec?.temp_nominal || 35}°C</div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span>Vibration (RMS)</span>
                </div>
                <div className="text-xl font-bold text-slate-900">{vibration} mm/s</div>
                <div className="text-[10px] text-slate-400 mt-0.5">ISO Limit: {nominal_spec?.vib_max || 4.5} mm/s</div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Gauge className="w-4 h-4 text-blue-500" />
                  <span>Head Pressure</span>
                </div>
                <div className="text-xl font-bold text-slate-900">{pressure} PSI</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Baseline: {nominal_spec?.pressure_nominal || 50} PSI</div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Power Draw</span>
                </div>
                <div className="text-xl font-bold text-slate-900">{power_consumption} kW</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Avg: {nominal_spec?.power_nominal || 45} kW</div>
              </div>
            </div>
          </div>

          {/* Telemetry Trend Chart */}
          {sensor_history.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Historical Telemetry Trend (Temperature & Vibration)
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Last 10 Log Intervals</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensor_history} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="timestamp" 
                      tick={{ fontSize: 9, fill: '#64748b' }} 
                      tickFormatter={(val) => val.includes('T') ? val.split('T')[0].slice(5) : val.slice(5, 10)}
                    />
                    <YAxis yAxisId="temp" orientation="left" tick={{ fontSize: 9, fill: '#64748b' }} unit="°C" />
                    <YAxis yAxisId="vib" orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} unit="mm/s" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line yAxisId="vib" type="monotone" dataKey="vibration" name="Vibration (mm/s)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Predictive Maintenance & Recommended Action Card */}
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">
                  <Wrench className="w-4 h-4 text-emerald-700" />
                  <span>AI Predictive Diagnosis & Prescriptive Action</span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {latest_prediction?.reason || "Operating within normal parameters. Routine preventive service recommended."}
                </p>
                <div className="mt-2 text-xs font-semibold text-emerald-900">
                  Recommended Action: <span className="font-normal text-emerald-800">{latest_prediction?.recommendation || "Maintain quarterly inspection schedule."}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateSchedule(asset_id);
                }}
                className="shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-xs transition-all"
              >
                <span>Schedule Work Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Alerts for this Asset */}
          {alerts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Active & Historical Alerts ({alerts.length})
              </h4>
              <div className="space-y-2">
                {alerts.map((al) => (
                  <div key={al.alert_id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          al.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {al.severity}
                        </span>
                        <span className="font-bold text-slate-900">{al.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{al.status}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{al.description}</p>
                    </div>
                    {al.status === 'NEW' && onAcknowledgeAlert && (
                      <button
                        onClick={() => onAcknowledgeAlert(al.alert_id)}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 shrink-0"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
