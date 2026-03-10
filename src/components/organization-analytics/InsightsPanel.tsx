import React from 'react'
import { Sparkles, TrendingUp, CalendarDays, BarChart2 } from 'lucide-react'
import { Insight } from '@/app/(dashboard)/company-analytics/data'

interface InsightsPanelProps {
    insights: Insight[]
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
    if (!insights || insights.length === 0) return null

    return (
        <div className="bg-gradient-to-br from-indigo-500/5 via-card to-purple-500/5 border border-indigo-500/20 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col mb-6 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-semibold text-foreground">Analytics Insights</h3>
                </div>
                <p className="text-sm text-muted-foreground">Automatic insights based on your recent activity and performance patterns.</p>
            </div>

            <ul className="space-y-4">
                {insights.map((insight) => (
                    <li key={insight.id} className="flex items-start gap-4 bg-background/60 hover:bg-background/80 transition-colors backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-sm">
                        <div className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${insight.type === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
                                insight.type === 'negative' ? 'bg-rose-500/10 text-rose-500' :
                                    'bg-blue-500/10 text-blue-500'
                            }`}>
                            {insight.type === 'positive' && <TrendingUp className="w-4 h-4" />}
                            {insight.type === 'neutral' && <CalendarDays className="w-4 h-4" />}
                            {insight.type === 'negative' && <BarChart2 className="w-4 h-4" />}
                        </div>
                        <div className="flex items-center min-h-[32px]">
                            <span className="text-sm text-foreground/90 font-medium leading-relaxed">
                                {insight.text}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
