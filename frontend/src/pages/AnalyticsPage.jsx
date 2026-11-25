import React from 'react';
import WeeklyComparisonChart from '../charts/WeeklyComparisonChart';
import FloorWiseChart from '../charts/FloorWiseChart';
import CategoryDonutChart from '../charts/CategoryDonutChart';
import { BarChart3, PieChart, Layers } from 'lucide-react';

export default function AnalyticsPage({
  weeklyData,
  distribution,
  summary
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Energy Consumption Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparative subsystem analytics, floor energy intensity, and weekly benchmarks
          </p>
        </div>
      </div>

      {/* Top Row: Weekly Comparison & Subsystem Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Weekly Energy Consumption by Subsystem</h3>
            <p className="text-xs text-slate-400">Weekly aggregated consumption across HVAC, Lighting, and Equipment</p>
          </div>
          <WeeklyComparisonChart data={weeklyData} />
        </div>

        {/* Subsystem Donut */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-800">Energy Subsystem Share</h3>
            <p className="text-xs text-slate-400">Overall percentage distribution</p>
          </div>
          <CategoryDonutChart data={distribution?.categories} />
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            {distribution?.categories?.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cat.color }}></span>
                  {cat.name}
                </span>
                <span className="font-semibold text-slate-800">{cat.value.toLocaleString()} kWh ({cat.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floor-wise Comparative Bar Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800">Floor-Wise Energy Intensity & Stacked Subsystems</h3>
          <p className="text-xs text-slate-400">Comparative breakdown across all facility levels</p>
        </div>
        <FloorWiseChart data={distribution?.floor_wise} />
      </div>

      {/* Analytics Summary Table */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800">Floor Consumption & Efficiency Metrics</h3>
          <p className="text-xs text-slate-400">Granular consumption metrics by facility level</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
                <th className="py-2.5 px-3">Floor</th>
                <th className="py-2.5 px-3">Total Electricity</th>
                <th className="py-2.5 px-3">HVAC Load</th>
                <th className="py-2.5 px-3">Lighting Load</th>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Water Draw</th>
                <th className="py-2.5 px-3">Share (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {distribution?.floor_wise?.map((fl, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{fl.floor}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{fl.electricity_kwh.toLocaleString()} kWh</td>
                  <td className="py-2.5 px-3 text-sky-700">{fl.hvac_kwh.toLocaleString()} kWh</td>
                  <td className="py-2.5 px-3 text-amber-700">{fl.lighting_kwh.toLocaleString()} kWh</td>
                  <td className="py-2.5 px-3 text-emerald-700">{fl.equipment_kwh.toLocaleString()} kWh</td>
                  <td className="py-2.5 px-3 text-blue-700">{fl.water_litres.toLocaleString()} L</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{fl.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
