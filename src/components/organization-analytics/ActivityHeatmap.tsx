'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { ActivityDay } from '@/app/(dashboard)/company-analytics/data'

interface ActivityHeatmapProps {
    data: ActivityDay[]
}

const CELL_SIZE = 13
const CELL_GAP = 3
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

const LEVEL_COLORS = [
    'bg-muted/30',           // level 0
    'bg-emerald-900/60',     // level 1
    'bg-emerald-700/70',     // level 2
    'bg-emerald-500/80',     // level 3
    'bg-emerald-400',        // level 4
]

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    // Group data into weeks (columns)
    const weeks = useMemo(() => {
        const result: ActivityDay[][] = []
        let currentWeek: ActivityDay[] = []

        // Pad the first week so activities start on the correct day of week
        if (data.length > 0) {
            const firstDate = new Date(data[0].date)
            const startDay = firstDate.getDay() // 0 = Sun
            for (let i = 0; i < startDay; i++) {
                currentWeek.push({ date: '', count: -1, level: 0 })
            }
        }

        data.forEach((day) => {
            currentWeek.push(day)
            if (currentWeek.length === 7) {
                result.push(currentWeek)
                currentWeek = []
            }
        })

        if (currentWeek.length > 0) {
            result.push(currentWeek)
        }

        return result
    }, [data])

    // Month labels
    const monthLabels = useMemo(() => {
        const labels: { label: string; col: number }[] = []
        let lastMonth = ''

        weeks.forEach((week, weekIdx) => {
            const validDay = week.find(d => d.date !== '')
            if (validDay) {
                const date = new Date(validDay.date)
                const month = date.toLocaleDateString('en-US', { month: 'short' })
                if (month !== lastMonth) {
                    labels.push({ label: month, col: weekIdx })
                    lastMonth = month
                }
            }
        })

        return labels
    }, [weeks])

    // Total activities
    const totalActivities = useMemo(
        () => data.reduce((sum, d) => sum + Math.max(0, d.count), 0),
        [data]
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                        <Flame className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Activity Heatmap</h3>
                        <p className="text-xs text-muted-foreground">{totalActivities.toLocaleString()} activities in the last year</p>
                    </div>
                </div>

                {/* Legend */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Less</span>
                    {LEVEL_COLORS.map((color, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-sm ${color}`}
                        />
                    ))}
                    <span>More</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-flex flex-col gap-0" style={{ minWidth: weeks.length * (CELL_SIZE + CELL_GAP) + 30 }}>
                    {/* Month labels */}
                    <div className="flex ml-[30px] mb-1" style={{ height: 16 }}>
                        {monthLabels.map((m, i) => (
                            <span
                                key={i}
                                className="text-[10px] text-muted-foreground absolute-style"
                                style={{
                                    position: 'relative',
                                    left: m.col * (CELL_SIZE + CELL_GAP) - (i > 0 ? monthLabels[i - 1].col * (CELL_SIZE + CELL_GAP) + (monthLabels[i - 1].label.length * 6) : 0),
                                    marginRight: 0,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex gap-0">
                        {/* Day labels */}
                        <div className="flex flex-col justify-between pr-2" style={{ height: 7 * (CELL_SIZE + CELL_GAP) - CELL_GAP }}>
                            {DAY_LABELS.map((label, i) => (
                                <span key={i} className="text-[10px] text-muted-foreground leading-none" style={{ height: CELL_SIZE }}>
                                    {label}
                                </span>
                            ))}
                        </div>

                        {/* Weeks */}
                        <div className="flex" style={{ gap: CELL_GAP }}>
                            {weeks.map((week, weekIdx) => (
                                <div key={weekIdx} className="flex flex-col" style={{ gap: CELL_GAP }}>
                                    {week.map((day, dayIdx) => (
                                        <div
                                            key={dayIdx}
                                            className={`rounded-sm transition-colors ${day.count < 0 ? 'bg-transparent' : LEVEL_COLORS[day.level]
                                                }`}
                                            style={{ width: CELL_SIZE, height: CELL_SIZE }}
                                            title={day.date ? `${day.date}: ${day.count} activities` : ''}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
