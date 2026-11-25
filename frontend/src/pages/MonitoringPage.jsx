import React, { useState } from 'react';
import HourlyConsumptionChart from '../charts/HourlyConsumptionChart';
import DailyTrendChart from '../charts/DailyTrendChart';
import WaterConsumptionChart from '../charts/WaterConsumptionChart';
import { Activity, Droplets, Zap, Filter } from 'lucide-react';

export default function MonitoringPage({
  hourlyData,
  dailyData,
  selectedFloor,
  setSelectedFloor,
  floors = []
}) {
  const [activeSubTab, setActiveSubTab] = useState('electricity');

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Energy & Utility Monitoring
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous smart meter telemetry tracking electricity and water profiles
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Subsystem Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('electricity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeSubTab === 'electricity'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Electricity</span>
            </button>
            <button
              onClick={() => setActiveSubTab('water')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeSubTab === 'water'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>Water</span>
            </button>
          </div>

          {/* Floor Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Floors</option>
              {floors.map((fl) => (
                <option key={fl} value={fl}>
                  {fl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Charts Depending on Active Sub-Tab */}
      {activeSubTab === 'electricity' ? (
        <div className="space-y-6">
          {/* Daily Trend with HVAC Gradient Area Chart */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">Daily Electricity Consumption & HVAC Contribution</h3>
              <p className="text-xs text-slate-400">Total building consumption vs HVAC cooling load</p>
            </div>
            <DailyTrendChart data={dailyData} />
          </div>

          {/* Hourly Telemetry Line Chart */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">Hourly Telemetry Curve vs Expected Baseline</h3>
              <p className="text-xs text-slate-400">Granular 60-minute telemetry resolution</p>
            </div>
            <HourlyConsumptionChart data={hourlyData} />
          </div>
        </div>
      ) : (
        /* Water Consumption View */
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Facility Water Flow & Consumption Trend</h3>
            <p className="text-xs text-slate-400">Hourly flow rates in Litres with leak anomaly tracking</p>
          </div>
          <WaterConsumptionChart data={hourlyData} />
        </div>
      )}
    </div>
  );
}
