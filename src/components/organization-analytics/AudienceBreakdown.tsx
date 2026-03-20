'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Building2, MapPin, Award } from 'lucide-react'
import { AudienceSegment } from '@/app/(authenticated)/(dashboard)/company-analytics/data'

interface AudienceBreakdownProps {
    industry: AudienceSegment[]
    location: AudienceSegment[]
    seniority: AudienceSegment[]
}

function SegmentCard({
    title,
    subtitle,
    icon: Icon,
    segments,
    delay,
}: {
    title: string
    subtitle: string
    icon: React.ElementType
    segments: AudienceSegment[]
    delay: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                    <Icon className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
            </div>

            <div className="space-y-3">
                {segments.map((segment) => (
                    <div key={segment.label}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-foreground">{segment.label}</span>
                            <span className="text-xs font-semibold text-muted-foreground">{segment.value}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${segment.value}%` }}
                                transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: segment.color }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}

export function AudienceBreakdown({ industry, location, seniority }: AudienceBreakdownProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SegmentCard
                title="By Industry"
                subtitle="Top industries"
                icon={Building2}
                segments={industry}
                delay={0.4}
            />
            <SegmentCard
                title="By Location"
                subtitle="Top locations"
                icon={MapPin}
                segments={location}
                delay={0.5}
            />
            <SegmentCard
                title="By Seniority"
                subtitle="Career levels"
                icon={Award}
                segments={seniority}
                delay={0.6}
            />
        </div>
    )
}
