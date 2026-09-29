import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, className }) => {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-600">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900 financial-data">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn("text-xs font-medium", trend.isPositive ? "text-emerald-800" : "text-rose-700")}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-slate-500">from last month</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <Icon className="h-5 w-5 text-emerald-800" />
        </div>
      </div>
    </div>
  );
};
