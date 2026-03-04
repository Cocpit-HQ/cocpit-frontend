'use client'

import React from 'react'
import { KpiMetric } from '@/app/(dashboard)/company-analytics/data'
import { CompanyKpiCard } from './CompanyKpiCard'

interface CompanyKpiCardsProps {
    metrics: KpiMetric[]
}

export function CompanyKpiCards({ metrics }: CompanyKpiCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map((metric, index) => (
                <CompanyKpiCard key={metric.id} metric={metric} index={index} />
            ))}
        </div>
    )
}
