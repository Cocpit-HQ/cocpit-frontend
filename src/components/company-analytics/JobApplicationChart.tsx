'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from 'recharts'
import { JobApplicationPoint } from '@/app/(dashboard)/company-analytics/data'

interface JobApplicationChartProps {
    data: JobApplicationPoint[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null

    return (
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg min-w-[140px]">
            <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
            {payload.map((entry: { name: string; value: number; color: string }, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-muted-foreground capitalize">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                        {entry.value.toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
    if (!payload?.length) return null

    return (
        <div className="flex items-center justify-center gap-6 mt-2">
            {payload.map((entry: { value: string; color: string }, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                        {entry.value}
                    </span>
                </div>
            ))}
        </div>
    )
}

export function JobApplicationChart({ data }: JobApplicationChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
            <div className="mb-6">
                <h3 className="text-base font-semibold text-foreground">Application Trend</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Applications vs views by week</p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="appBarGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="jobViewBarGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="week"
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                        />

                        <YAxis
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                            width={45}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border)', opacity: 0.3 }} />
                        <Legend content={<CustomLegend />} />

                        <Bar
                            dataKey="applications"
                            fill="url(#appBarGrad)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                        />
                        <Bar
                            dataKey="views"
                            fill="url(#jobViewBarGrad)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
