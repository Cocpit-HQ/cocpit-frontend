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
    Legend,
} from 'recharts'
import { FollowerGrowthPoint } from '@/app/(authenticated)/(dashboard)/company-analytics/data'

interface FollowerGrowthChartProps {
    data: FollowerGrowthPoint[]
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
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-muted-foreground capitalize">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{entry.value.toLocaleString()}</span>
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
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs font-medium text-muted-foreground capitalize">{entry.value}</span>
                </div>
            ))}
        </div>
    )
}

export function FollowerGrowthChart({ data }: FollowerGrowthChartProps) {
    const tickInterval = data.length <= 7 ? 0 : data.length <= 30 ? 4 : 13

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
            <div className="mb-6">
                <h3 className="text-base font-semibold text-foreground">Follower Growth</h3>
                <p className="text-sm text-muted-foreground mt-0.5">New followers vs unfollows over time</p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="unfollowGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={tickInterval} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={45} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)' }} />
                        <Legend content={<CustomLegend />} />

                        <Area type="monotone" dataKey="followers" stroke="#10b981" strokeWidth={2.5} fill="url(#followerGrad)" dot={false} activeDot={{ r: 5, fill: '#10b981', stroke: 'var(--card)', strokeWidth: 2 }} />
                        <Area type="monotone" dataKey="unfollows" stroke="#f43f5e" strokeWidth={1.5} fill="url(#unfollowGrad)" dot={false} activeDot={{ r: 4, fill: '#f43f5e', stroke: 'var(--card)', strokeWidth: 2 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
