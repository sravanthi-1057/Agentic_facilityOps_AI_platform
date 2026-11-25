import React from 'react';

export default function KpiCard({ title, value, unit, change, icon: Icon, color = 'emerald', subtext }) {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-100'
    },
    blue: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      iconBg: 'bg-sky-100'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      iconBg: 'bg-rose-100'
    },
    violet: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      iconBg: 'bg-purple-100'
    }
  };

  const currentStyle = colorStyles[color] || colorStyles.emerald;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-lg ${currentStyle.iconBg} flex items-center justify-center ${currentStyle.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </div>

      {subtext && (
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{subtext}</span>
          {change && (
            <span className={`font-semibold ${change.startsWith('+') ? 'text-rose-600' : 'text-emerald-600'}`}>
              {change}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
