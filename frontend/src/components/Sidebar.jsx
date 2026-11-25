import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  BarChart3, 
  AlertTriangle, 
  Sparkles, 
  Database, 
  Settings,
  Building2,
  Zap,
  Wrench,
  Cpu,
  CalendarClock,
  AlertOctagon,
  ClipboardList,
  Layers
} from 'lucide-react';

const ENERGY_NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'monitoring', label: 'Energy Monitoring', icon: Activity },
  { id: 'analytics', label: 'Energy Analytics', icon: BarChart3 },
  { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle, badgeKey: 'anomalies' },
  { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles, badgeKey: 'recommendations' },
];

const MAINTENANCE_NAV = [
  { id: 'assets', label: 'Asset Monitoring', icon: Cpu },
  { id: 'predictions', label: 'Predictive Failure', icon: Wrench },
  { id: 'maintenance-alerts', label: 'Maintenance Alerts', icon: AlertOctagon, badgeKey: 'maintAlerts' },
  { id: 'maintenance-schedule', label: 'Work Orders & Schedule', icon: CalendarClock },
];

const SYSTEM_NAV = [
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  anomalyCount,
  recCount,
  maintAlertCount = 0
}) {
  const renderNavGroup = (title, items) => (
    <div className="mb-4">
      <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        {title}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          let badgeValue = null;
          if (item.badgeKey === 'anomalies') badgeValue = anomalyCount;
          else if (item.badgeKey === 'recommendations') badgeValue = recCount;
          else if (item.badgeKey === 'maintAlerts') badgeValue = maintAlertCount;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {badgeValue > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeKey === 'maintAlerts'
                      ? 'bg-amber-500/20 text-amber-300'
                      : item.badgeKey === 'anomalies'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-white tracking-tight leading-tight truncate">FacilityOps AI</h1>
          <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Milestone 1 & 2</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        {renderNavGroup("Energy Intelligence (M1)", ENERGY_NAV)}
        {renderNavGroup("Predictive Maintenance (M2)", MAINTENANCE_NAV)}
        {renderNavGroup("System & Platform", SYSTEM_NAV)}
      </div>

      {/* System Status Pill Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[11px] font-semibold text-slate-200">LangGraph Multi-Agent Active</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Energy Monitoring & Predictive Maintenance AI Agents operational.
        </p>
      </div>
    </aside>
  );
}
