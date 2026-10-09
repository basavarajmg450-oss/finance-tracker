import React from 'react';

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  badge = null
}) => {
  const getTrendClass = () => {
    switch (trend) {
      case 'positive':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'negative':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500">{subtitle}</span>}
        {badge && (
          <span className={`px-2 py-0.5 rounded-full font-medium border text-[11px] ${getTrendClass()}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
