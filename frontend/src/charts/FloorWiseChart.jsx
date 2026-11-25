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

export default function FloorWiseChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-xs text-slate-400">
        No floor-wise consumption data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} unit=" kWh" />
          <YAxis dataKey="floor" type="category" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
            formatter={(val, name) => [`${val} kWh`, name]}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey="hvac_kwh" name="HVAC" fill="#0284c7" stackId="a" />
          <Bar dataKey="lighting_kwh" name="Lighting" fill="#f59e0b" stackId="a" />
          <Bar dataKey="equipment_kwh" name="Equipment" fill="#10b981" stackId="a" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
