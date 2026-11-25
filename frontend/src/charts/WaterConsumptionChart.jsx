import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function WaterConsumptionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-xs text-slate-400">
        No water telemetry data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            tickFormatter={(val) => val.includes(' ') ? val.split(' ')[1] : val.slice(5)}
          />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit=" L" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
            formatter={(value) => [`${value} Litres`, 'Water Consumption']}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Area 
            type="monotone" 
            dataKey="water_usage" 
            name="Water Usage (Litres)" 
            stroke="#0284c7" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#waterGrad)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
