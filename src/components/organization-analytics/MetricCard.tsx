import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

export interface MetricCardProps {
    title: string
    mainNumber: string | number | null
    growthPercentage: number
    trend: 'up' | 'down'
    comparisonText?: string
    icon: LucideIcon
    iconColorClass: string
    iconBgColorHex: string
    sparklineData?: { value: number }[]
}

export function MetricCard({
    title,
    mainNumber,
    growthPercentage,
    trend,
    comparisonText,
    icon: Icon,
    iconColorClass,
    iconBgColorHex,
    sparklineData
}: MetricCardProps) {
    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/80 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-opacity-10"
                            style={{ backgroundColor: `${iconBgColorHex}1a` }}
                        >
                            <Icon className={`w-4 h-4 ${iconColorClass}`} />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    </div>
                    <h3 className="text-3xl font-bold text-foreground mt-2">
                        {mainNumber === null ? (
                            <Skeleton className="h-9 w-24" />
                        ) : (
                            typeof mainNumber === 'number' ? mainNumber.toLocaleString() : mainNumber
                        )}
                    </h3>
                </div>
            </div>

            <div className="flex items-end justify-between mt-auto">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        {mainNumber === null ? (
                            <Skeleton className="h-6 w-32" />
                        ) : (
                            <>
                                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${trend === 'up' ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20' : 'text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/20'}`}>
                                    {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                    {trend === 'up' ? '+' : '-'}{Math.abs(growthPercentage)}%
                                </div>
                                {comparisonText && (
                                    <span className="text-xs font-medium text-muted-foreground">{comparisonText}</span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {mainNumber !== null && sparklineData && sparklineData.length > 0 && (
                    <div className="w-24 h-10 ml-4 opacity-80" style={{ pointerEvents: 'none' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklineData}>
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={trend === 'up' ? '#10b981' : '#f43f5e'}
                                    strokeWidth={2.5}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
