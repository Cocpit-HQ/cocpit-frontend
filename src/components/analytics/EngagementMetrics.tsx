'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { EngagementDataPoint, getEngagementData } from '@/app/(dashboard)/analytics/data';

interface EngagementMetricsProps {
  data: EngagementDataPoint[]
  isDark?: boolean // Optional
}

export function EngagementMetrics({ data }: EngagementMetricsProps) {
  return (
    <div className="p-6 rounded-xl border h-full flex flex-col bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">
          Engagement Overview
        </h3>
        <p className="text-sm mt-1 text-muted-foreground">
          Profile interactions over time
        </p>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5B7CFF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#5B7CFF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                borderRadius: '8px',
                color: "var(--foreground)"
              }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: "var(--muted-foreground)" }}
            />
            <Area
              type="monotone"
              dataKey="views"
              name="Profile Views"
              stroke="#5B7CFF"
              fillOpacity={1}
              fill="url(#colorViews)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="likes"
              name="Interactions"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorLikes)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
