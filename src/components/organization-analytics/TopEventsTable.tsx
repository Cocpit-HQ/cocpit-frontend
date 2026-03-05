'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { TopEvent } from '@/app/(dashboard)/company-analytics/data'

interface TopEventsTableProps {
    data: TopEvent[]
}

export function TopEventsTable({ data }: TopEventsTableProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10">
                    <Trophy className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-foreground">Top Performing Events</h3>
                    <p className="text-xs text-muted-foreground">Ranked by registrations</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Event Name</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Registrations</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Views</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Conv. Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((event, index) => (
                            <tr
                                key={event.name}
                                className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                            >
                                <td className="py-3.5 text-sm text-muted-foreground font-medium">
                                    {index + 1}
                                </td>
                                <td className="py-3.5 text-sm font-medium text-foreground max-w-[240px] truncate">
                                    {event.name}
                                </td>
                                <td className="py-3.5 text-sm font-semibold text-foreground text-right">
                                    {event.registrations.toLocaleString()}
                                </td>
                                <td className="py-3.5 text-sm text-muted-foreground text-right">
                                    {event.views.toLocaleString()}
                                </td>
                                <td className="py-3.5 text-right">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400">
                                        {event.conversionRate}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}
