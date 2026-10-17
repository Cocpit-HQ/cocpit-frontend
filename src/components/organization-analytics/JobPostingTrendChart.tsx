'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts'
import { JobPostingPoint } from '@/app/(authenticated)/(dashboard)/company-analytics/data'

interface JobPostingTrendChartProps {
    data: JobPostingPoint[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null

    return (
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-lg font-bold text-foreground">
                {payload[0].value.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">jobs</span>
            </p>
        </div>
    )
}

export function JobPostingTrendChart({ data }: JobPostingTrendChartProps) {
    const tickInterval = data.length <= 7 ? 0 : data.length <= 30 ? 4 : 13

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
            <div className="mb-6">
                <h3 className="text-base font-semibold text-foreground">Job Posting Trend</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Jobs posted over time</p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="jobPostGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                            interval={tickInterval}
                        />

                        <YAxis
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                            width={45}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)' }} />

                        <Area
                            type="monotone"
                            dataKey="jobs"
                            stroke="#06b6d4"
                            strokeWidth={2.5}
                            fill="url(#jobPostGrad)"
                            dot={false}
                            activeDot={{
                                r: 5,
                                fill: '#06b6d4',
                                stroke: 'var(--card)',
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
