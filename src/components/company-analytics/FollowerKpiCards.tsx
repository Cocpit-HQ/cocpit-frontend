'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    UserPlus,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react'
import { FollowerKpiMetric } from '@/app/(dashboard)/company-analytics/data'
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter'

const iconMap = {
    Users,
    UserPlus,
    TrendingUp,
    Activity,
} as const

interface FollowerKpiCardsProps {
    metrics: FollowerKpiMetric[]
}

function FollowerKpiCard({ metric, index }: { metric: FollowerKpiMetric; index: number }) {
    const Icon = iconMap[metric.icon]
    const isRateCard = metric.id === 'follower-growth'
    const animatedValue = useAnimatedCounter(metric.value, 1400)

    const displayValue = isRateCard
        ? `${animatedValue.toFixed(1)}%`
        : Math.floor(animatedValue).toLocaleString()

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6
                 shadow-sm hover:shadow-lg transition-all duration-300
                 hover:scale-[1.02] hover:-translate-y-0.5 cursor-default"
        >
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${metric.accentHex}, transparent 70%)`,
                }}
            />
            <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div
                        className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl"
                        style={{ backgroundColor: `${metric.accentHex}15` }}
                    >
                        <Icon className={`w-6 h-6 ${metric.color}`} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-muted-foreground truncate">{metric.label}</p>
                        <p className="mt-1 text-2xl font-bold text-foreground tracking-tight">{displayValue}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-semibold ${metric.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {metric.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(metric.change)}%
                </div>
            </div>
        </motion.div>
    )
}

export function FollowerKpiCards({ metrics }: FollowerKpiCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map((metric, index) => (
                <FollowerKpiCard key={metric.id} metric={metric} index={index} />
            ))}
        </div>
    )
}
