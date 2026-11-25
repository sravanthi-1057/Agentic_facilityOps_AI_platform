import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function WeeklyComparisonChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-xs text-slate-400">
        No weekly comparison data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            tickFormatter={(val) => `Wk: ${val.slice(5)}`}
          />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit=" kWh" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
            formatter={(value, name) => [`${value} kWh`, name]}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey="hvac_usage" name="HVAC" fill="#0284c7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lighting_usage" name="Lighting" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="equipment_usage" name="Equipment" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
