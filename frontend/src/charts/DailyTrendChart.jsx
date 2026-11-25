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

export default function DailyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-xs text-slate-400">
        No daily trend data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="hvacGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            tickFormatter={(val) => val.slice(5)}
          />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit=" kWh" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
            formatter={(value, name) => [`${value} kWh`, name]}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Area 
            type="monotone" 
            dataKey="electricity_usage" 
            name="Total Electricity" 
            stroke="#10b981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#elecGrad)" 
          />
          <Area 
            type="monotone" 
            dataKey="hvac_usage" 
            name="HVAC Subsystem" 
            stroke="#0284c7" 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill="url(#hvacGrad)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
