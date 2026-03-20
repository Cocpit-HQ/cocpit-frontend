'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    Briefcase,
    FileText,
    Eye,
    TrendingUp,
} from 'lucide-react'
import { JobKpiMetric } from '@/app/(authenticated)/(dashboard)/company-analytics/data'
import { MetricCard } from './MetricCard'

const iconMap = {
    Briefcase,
    FileText,
    Eye,
    TrendingUp,
} as const

interface JobKpiCardsProps {
    metrics: JobKpiMetric[]
}

function JobKpiCard({ metric, index }: { metric: JobKpiMetric; index: number }) {
    const Icon = iconMap[metric.icon]
    const isRateCard = metric.id === 'application-growth'

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

export function JobKpiCards({ metrics }: JobKpiCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map((metric, index) => (
                <JobKpiCard key={metric.id} metric={metric} index={index} />
            ))}
        </div>
    )
}
