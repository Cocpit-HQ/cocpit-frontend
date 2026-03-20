'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BarChart2 } from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { WeeklyComparisonPoint } from '@/app/(authenticated)/(dashboard)/company-analytics/data'

interface SharesVsViewsChartProps {
    data: WeeklyComparisonPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border shadow-md rounded-lg p-3">
                <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm mt-1">
                        <div
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium text-foreground">
                            {entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export function SharesVsViewsChart({ data }: SharesVsViewsChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm h-full flex flex-col"
        >
            <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10">
                    <BarChart2 className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-foreground">Shares vs Views</h3>
                    <p className="text-xs text-muted-foreground">Weekly comparison</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        barGap={8}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis
                            dataKey="week"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickFormatter={(value: number) => `${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar
                            dataKey="views"
                            name="Views"
                            fill="#3b82f6" // custom requested Blue
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                        <Bar
                            dataKey="shares"
                            name="Shares"
                            fill="#8b5cf6" // custom requested Purple
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
