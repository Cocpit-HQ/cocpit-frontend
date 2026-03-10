'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    UserPlus,
    TrendingUp,
    Activity,
} from 'lucide-react'
import { FollowerKpiMetric } from '@/app/(dashboard)/company-analytics/data'
import { MetricCard } from './MetricCard'

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

    const displayValue = isRateCard
        ? `${metric.value.toFixed(1)}%`
        : metric.value

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
            className="h-full"
        >
            <MetricCard
                title={metric.label}
                mainNumber={displayValue}
                growthPercentage={metric.change}
                trend={metric.trend}
                comparisonText={metric.comparisonText}
                icon={Icon}
                iconColorClass={metric.color}
                iconBgColorHex={metric.accentHex}
                sparklineData={metric.sparklineData}
            />
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
