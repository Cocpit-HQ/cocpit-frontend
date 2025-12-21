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
import { EngagementDataPoint } from '@/app/analytics/data'

interface EngagementMetricsProps {
  data: EngagementDataPoint[]
  isDark: boolean
}

export function EngagementMetrics({ data, isDark }: EngagementMetricsProps) {
  return (
    <div className={`p-6 rounded-xl border h-full flex flex-col
      ${isDark
        ? 'bg-[#242b3d] border-[#2d3548]'
        : 'bg-white border-gray-200'
      }`}
    >
      <div className="mb-6">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Engagement Overview
        </h3>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                <stop offset="5%" stopColor="#5B7CFF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#5B7CFF" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2d3548' : '#e5e7eb'} />
            <XAxis
              dataKey="date"
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                borderRadius: '8px',
                color: isDark ? '#f3f4f6' : '#111827'
              }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: isDark ? '#9ca3af' : '#6b7280' }}
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
