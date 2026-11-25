import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Bell, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2,
  Wrench,
  Activity,
  ChevronDown,
  Cpu
} from 'lucide-react';

export default function TopNav({
  facilities = [],
  selectedFacility = 'all',
  setSelectedFacility,
  selectedRange = 30,
  setSelectedRange,
  onRefresh,
  onRunAgent,
  onRunMaintenanceAgent,
  onRefreshTelemetry,
  isRefreshing = false,
  isRefreshingTelemetry = false,
  healthData,
  anomalyCount = 0,
  maintAlertCount = 0,
  activeTab = 'overview'
}) {
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);

  const totalAlerts = (anomalyCount || 0) + (maintAlertCount || 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
      {/* Title & Facility Select */}
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Agentic FacilityOps AI Platform
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Simulated IoT Active
            </span>
            <span>•</span>
            <span className="text-[11px] text-slate-500 font-mono">
              {healthData?.databases?.sql_database?.engine || 'SQLite/MySQL'}
            </span>
          </div>
        </div>

        {/* Facility Dropdown */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="bg-transparent font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Facilities</option>
            {facilities.map((f) => (
              <option key={f.facility_id} value={f.facility_id}>
                {f.facility_name} ({f.facility_id})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Dropdown */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(Number(e.target.value))}
            className="bg-transparent font-medium focus:outline-none cursor-pointer"
          >
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Simulate Sensor Stream Button */}
        {onRefreshTelemetry && (
          <button
            onClick={onRefreshTelemetry}
            disabled={isRefreshingTelemetry}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Inject real-time telemetry cycle into IoT assets"
          >
            <Activity className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshingTelemetry ? 'animate-pulse' : ''}`} />
            <span>{isRefreshingTelemetry ? 'Streaming...' : 'Simulate Sensor Stream'}</span>
          </button>
        )}

        {/* Agent Dropdown / Trigger */}
        <div className="relative">
          <div className="inline-flex rounded-lg shadow-xs shadow-emerald-600/10">
            <button
              onClick={() => {
                // If on maintenance tabs, run maintenance agent by default; else energy agent
                if (['assets', 'predictions', 'maintenance-alerts', 'maintenance-schedule'].includes(activeTab)) {
                  onRunMaintenanceAgent();
                } else {
                  onRunAgent();
                }
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-semibold px-3.5 py-2 rounded-l-lg transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {['assets', 'predictions', 'maintenance-alerts', 'maintenance-schedule'].includes(activeTab)
                  ? 'Run Maintenance Agent'
                  : 'Execute Energy Agent'}
              </span>
            </button>
            <button
              onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-2 rounded-r-lg border-l border-emerald-600 transition-colors"
              title="Select AI Agent"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Agent Dropdown Menu */}
          {isAgentMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
              <button
                onClick={() => {
                  setIsAgentMenuOpen(false);
                  onRunAgent();
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-start gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">Energy Intelligence Agent</div>
                  <div className="text-[11px] text-slate-500">M1: Anomaly detection & energy saving</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsAgentMenuOpen(false);
                  onRunMaintenanceAgent();
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-start gap-2.5 border-t border-slate-100"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">Predictive Maintenance Agent</div>
                  <div className="text-[11px] text-slate-500">M2: Asset health scoring & failure risk</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Refresh Dashboard Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          title="Refresh Dashboard"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
            FM
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">Facility Manager</div>
            <div className="text-[10px] text-slate-600 font-medium">Infosys Springboard</div>
          </div>
        </div>
      </div>
    </header>
  );
}
