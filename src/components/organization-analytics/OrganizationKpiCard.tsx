'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    Eye,
    Share2,
    Users,
    MessageCircle,
    Bell,
    TrendingUp,
} from 'lucide-react'
import { KpiMetric } from '@/app/(dashboard)/company-analytics/data'
import { MetricCard } from './MetricCard'

const iconMap = {
    Eye,
    Share2,
    Users,
    MessageCircle,
    Bell,
    TrendingUp,
} as const

interface OrganizationKpiCardProps {
    metric: KpiMetric
    index: number
}

export function OrganizationKpiCard({ metric, index }: OrganizationKpiCardProps) {
    const Icon = iconMap[metric.icon]
    const isGrowthCard = metric.id === 'growth'

    const displayValue = metric.value === null
        ? null
        : isGrowthCard
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
