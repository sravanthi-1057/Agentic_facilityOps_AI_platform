import React, { useState } from 'react';
import { 
  Cpu, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Eye, 
  RefreshCw, 
  Plus, 
  Sparkles,
  Thermometer,
  Gauge
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

export default function AssetMonitoringPage({
  kpis,
  assets = [],
  facilities = [],
  selectedFacility,
  onSelectAsset,
  onRefreshTelemetry,
  isRefreshingTelemetry,
  onOpenCreateSchedule,
  onRunMaintenanceAgent
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('health_score');
  const [sortOrder, setSortOrder] = useState('asc'); // asc = lowest health first

  // Extract unique asset types and floors
  const assetTypes = Array.from(new Set(assets.map(a => a.asset_type))).sort();
  const floors = Array.from(new Set(assets.map(a => a.floor))).sort();

  // Filter & Search
  const filteredAssets = assets
    .filter(a => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = a.asset_name.toLowerCase().includes(q) || a.asset_id.toLowerCase().includes(q);
      const matchesType = selectedType === 'all' || a.asset_type === selectedType;
      const matchesFloor = selectedFloor === 'all' || a.floor === selectedFloor;
      const matchesStatus = selectedStatus === 'all' || a.operational_status === selectedStatus;
      return matchesSearch && matchesType && matchesFloor && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

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

  const getHealthPill = (score) => {
    let color = 'bg-emerald-500';
    let text = 'text-emerald-700';
    let bg = 'bg-emerald-50';
    if (score < 40) {
      color = 'bg-rose-500';
      text = 'text-rose-700';
      bg = 'bg-rose-50';
    } else if (score < 60) {
      color = 'bg-orange-500';
      text = 'text-orange-700';
      bg = 'bg-orange-50';
    } else if (score < 75) {
      color = 'bg-amber-500';
      text = 'text-amber-700';
      bg = 'bg-amber-50';
    }

    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${bg} ${text}`}>
          {score}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            Milestone 2 — Predictive Maintenance & Equipment Health
          </div>
          <h2 className="text-xl font-bold tracking-tight">Enterprise Asset Telemetry & Diagnostics</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Continuous vibration, temperature, and head pressure telemetry across critical HVAC, pump, generator, and electrical infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            onClick={onRefreshTelemetry}
            disabled={isRefreshingTelemetry}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-white/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTelemetry ? 'animate-spin' : ''}`} />
            <span>Simulate Sensor Stream</span>
          </button>
          <button
            onClick={onRunMaintenanceAgent}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run Maintenance Agent</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <KpiCard
          title="Monitored Assets"
          value={kpis?.total_assets_count || 0}
          icon={Cpu}
          color="blue"
          subtext="Active Infrastructure"
        />
        <KpiCard
          title="Healthy Assets"
          value={kpis?.healthy_assets_count || 0}
          icon={CheckCircle2}
          color="emerald"
          subtext="Score ≥ 75"
        />
        <KpiCard
          title="Warning Assets"
          value={kpis?.warning_assets_count || 0}
          icon={AlertTriangle}
          color="amber"
          subtext="Score 60–74"
        />
        <KpiCard
          title="Critical Assets"
          value={kpis?.critical_assets_count || 0}
          icon={ShieldAlert}
          color="rose"
          subtext="Score < 40"
        />
        <KpiCard
          title="Predicted Failures"
          value={kpis?.predicted_failures_count || 0}
          icon={Activity}
          color="rose"
          subtext="Risk ≥ 50%"
        />
        <KpiCard
          title="Open Alerts"
          value={kpis?.open_alerts_count || 0}
          icon={ShieldAlert}
          color="amber"
          subtext={`${kpis?.critical_alerts_count || 0} Critical`}
        />
        <KpiCard
          title="Scheduled Tasks"
          value={kpis?.scheduled_tasks_count || 0}
          icon={Wrench}
          color="blue"
          subtext={`${kpis?.overdue_tasks_count || 0} Overdue`}
        />
      </div>

      {/* Health Distribution & Asset Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Distribution Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Fleet Health Score Distribution</h3>
              <p className="text-xs text-slate-400">Equipment counts segmented by health rating categories</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              Fleet Average: {kpis?.avg_fleet_health_score || 0}/100
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis?.health_distribution || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Assets" radius={[4, 4, 0, 0]}>
                  {(kpis?.health_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Types Distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Equipment Category Breakdown</h3>
            <p className="text-xs text-slate-400 mb-3">Facility asset inventory</p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(kpis?.asset_type_distribution || []).map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">{t.type}</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {t.count} units
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Monitoring Table & Search Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets by name or ID (e.g. AST-CHL-001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Filter by Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Types</option>
              {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Filter by Floor */}
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Floors</option>
              {floors.map(fl => <option key={fl} value={fl}>{fl}</option>)}
            </select>

            {/* Filter by Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="WARNING">Warning</option>
              <option value="DEGRADED">Degraded</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="health_score">Sort: Health Score</option>
              <option value="failure_risk_pct">Sort: Failure Risk</option>
              <option value="temperature">Sort: Temperature</option>
              <option value="vibration">Sort: Vibration</option>
              <option value="asset_name">Sort: Name</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/80">
                <th className="py-3 px-4">Asset Name & ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Health Score</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Vibration</th>
                <th className="py-3 px-4">Failure Risk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No assets found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.asset_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{asset.asset_name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{asset.asset_id}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {asset.asset_type}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {asset.facility_id} • {asset.floor}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getHealthPill(asset.health_score)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                      {asset.temperature}°C
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                      {asset.vibration} mm/s
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`font-bold ${asset.failure_risk_pct >= 50 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {asset.failure_risk_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(asset.operational_status)}`}>
                        {asset.operational_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectAsset(asset.asset_id)}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
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
