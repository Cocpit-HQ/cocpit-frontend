'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { ActivityDay } from '@/app/(authenticated)/(dashboard)/company-analytics/data'

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

    // Total activities and stats
    const stats = useMemo(() => {
        let total = 0
        const monthCounts: Record<string, number> = {}
        const dayCounts: Record<string, number> = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 }
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

        data.forEach(d => {
            if (d.count > 0 && d.date) {
                total += d.count
                const date = new Date(d.date)
                const month = date.toLocaleDateString('en-US', { month: 'long' })
                const day = dayNames[date.getDay()]
                monthCounts[month] = (monthCounts[month] || 0) + d.count
                dayCounts[day] = (dayCounts[day] || 0) + d.count
            }
        })

        const peakMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
        const mostActiveDayShortcut = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

        const fullDayNames: Record<string, string> = { 'Sun': 'Sunday', 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday' }

        return {
            totalActivities: total,
            peakMonth,
            mostActiveDay: fullDayNames[mostActiveDayShortcut] || mostActiveDayShortcut
        }
    }, [data])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                            <Flame className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Activity Heatmap</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Your company activity over the last 12 months.</p>
                </div>

                <div className="flex items-center gap-6 bg-muted/30 px-4 py-2 rounded-xl">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total</span>
                        <span className="font-semibold text-foreground text-sm">{stats.totalActivities.toLocaleString()}</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Most Active</span>
                        <span className="font-semibold text-foreground text-sm">{stats.mostActiveDay}</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Peak Month</span>
                        <span className="font-semibold text-foreground text-sm">{stats.peakMonth}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mb-4">
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
