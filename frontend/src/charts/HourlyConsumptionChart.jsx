import React from 'react';
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

export default function HourlyConsumptionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-xs text-slate-400">
        No hourly telemetry data available for this selection.
      </div>
    );
  }

  // Display subset of points if too dense (e.g. up to 48 points)
  const displayData = data.slice(-48);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            tickFormatter={(val) => val.split(' ')[1] || val}
          />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit=" kWh" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
            formatter={(value, name) => [`${value} kWh`, name === 'electricity_usage' ? 'Actual Usage' : 'Baseline Expected']}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Line 
            type="monotone" 
            dataKey="electricity_usage" 
            name="electricity_usage" 
            stroke="#16a34a" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4 }} 
          />
          <Line 
            type="monotone" 
            dataKey="baseline_expected" 
            name="baseline_expected" 
            stroke="#94a3b8" 
            strokeDasharray="4 4" 
            strokeWidth={1.5} 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
