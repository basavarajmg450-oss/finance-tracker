import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Calculator } from 'lucide-react';

export const InsightCard = ({ insight }) => {
  const getStyle = () => {
    switch (insight.type) {
      case 'danger':
        return {
          border: 'border-rose-200 bg-rose-50/50',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: AlertCircle,
          iconColor: 'text-rose-600'
        };
      case 'warning':
        return {
          border: 'border-amber-200 bg-amber-50/50',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-600'
        };
      case 'success':
        return {
          border: 'border-emerald-200 bg-emerald-50/50',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600'
        };
      default:
        return {
          border: 'border-blue-200 bg-blue-50/50',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Info,
          iconColor: 'text-blue-600'
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <div className={`p-4 rounded-xl border ${style.border} transition-all`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <Icon className={`w-5 h-5 ${style.iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-900">{insight.title}</h4>
            <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
              {insight.category}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{insight.message}</p>

          {insight.calculation && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 bg-white/80 px-2.5 py-1.5 rounded-md border border-slate-200/60 font-mono">
              <Calculator className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Logic: {insight.calculation}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
