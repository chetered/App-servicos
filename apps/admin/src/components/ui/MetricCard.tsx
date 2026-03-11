'use client';

import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // % change, positive = up, negative = down
  icon?: React.ReactNode;
  color?: 'default' | 'green' | 'blue' | 'purple' | 'orange';
}

const COLOR_MAP = {
  default: 'bg-gray-50 text-gray-600',
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
};

export function MetricCard({ title, value, subtitle, trend, icon, color = 'default' }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', COLOR_MAP[color])}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        {trend !== undefined && (
          <div
            className={clsx(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
              trend > 0
                ? 'bg-green-50 text-green-700'
                : trend < 0
                ? 'bg-red-50 text-red-700'
                : 'bg-gray-50 text-gray-500'
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}
