'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    CalendarPlus,
    UserCheck,
    Eye,
    TrendingUp,
} from 'lucide-react'
import { EventKpiMetric } from '@/app/(authenticated)/(dashboard)/company-analytics/data'
import { MetricCard } from './MetricCard'

const iconMap = {
    CalendarPlus,
    UserCheck,
    Eye,
    TrendingUp,
} as const

interface EventKpiCardsProps {
    metrics: EventKpiMetric[]
}

function EventKpiCard({ metric, index }: { metric: EventKpiMetric; index: number }) {
    const Icon = iconMap[metric.icon]
    const isRateCard = metric.id === 'registration-growth'

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

export function EventKpiCards({ metrics }: EventKpiCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map((metric, index) => (
                <EventKpiCard key={metric.id} metric={metric} index={index} />
            ))}
        </div>
    )
}
