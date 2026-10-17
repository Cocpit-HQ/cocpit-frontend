'use client'

import React from 'react'
import { KpiMetric } from '@/app/(authenticated)/(dashboard)/company-analytics/data'
import { OrganizationKpiCard } from './OrganizationKpiCard'

interface OrganizationKpiCardsProps {
    metrics: KpiMetric[]
}

export function OrganizationKpiCards({ metrics }: OrganizationKpiCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map((metric, index) => (
                <OrganizationKpiCard key={metric.id} metric={metric} index={index} />
            ))}
        </div>
    )
}
