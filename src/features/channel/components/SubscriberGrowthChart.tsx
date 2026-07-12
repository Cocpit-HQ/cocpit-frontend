'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { GrowthPoint } from '../types/channel.types';

interface SubscriberGrowthChartProps {
  data: GrowthPoint[];
  totalSubscribers: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg min-w-[120px]">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <span className="text-sm font-semibold text-foreground">
        {payload[0].value.toLocaleString()} subscribers
      </span>
    </div>
  );
}

export default function SubscriberGrowthChart({ data, totalSubscribers }: SubscriberGrowthChartProps) {
  const growthPercent = useMemo(() => {
    if (data.length < 2) return 0;
    const first = data[0].subscribers || 1;
    const last = data[data.length - 1].subscribers;
    return (((last - first) / first) * 100);
  }, [data]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <h3 className="text-black dark:text-[#F9FAFB] text-sm font-semibold font-['Poppins']">
            Subscriber growth
          </h3>
          <span className="text-gray-400 text-xs font-['Poppins']">
            Total subscribers - {totalSubscribers.toLocaleString()}
          </span>
        </div>
        <span className="text-emerald-500 text-sm font-semibold font-['Poppins']">
          {growthPercent >= 0 ? '+' : ''}
          {growthPercent.toFixed(1)}%
        </span>
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="subscriberGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A73E8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)' }} />

            <Area
              type="monotone"
              dataKey="subscribers"
              stroke="#1A73E8"
              strokeWidth={2.5}
              fill="url(#subscriberGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#1A73E8', stroke: 'var(--card)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
