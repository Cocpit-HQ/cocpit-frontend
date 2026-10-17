'use client'

import React from 'react'
import { Eye, Search, UserPlus, MessageSquare, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { OverviewStat } from '@/app/(authenticated)/(dashboard)/analytics/data';
import { Skeleton } from '@/components/ui/skeleton';

interface OverviewStatsProps {
  stats: OverviewStat[]
  isDark?: boolean // Optional
}

const icons = {
  Eye,
  Search,
  UserPlus,
  MessageSquare
}

export function OverviewStats({ stats }: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = icons[stat.iconName]
        const isPositive = stat.trend === 'up'
        const isNeutral = stat.trend === 'neutral'

        return (
          <div
            key={index}
            className="p-5 rounded-xl border transition-all hover:shadow-md bg-card border-border hover:border-muted-foreground/20"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
                <Icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
                ${stat.value === null 
                  ? 'bg-transparent text-transparent' // Hide trend while loading
                  : isNeutral
                    ? 'bg-muted text-muted-foreground'
                    : isPositive
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                {stat.value !== null && (
                  <>
                    {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-1 text-foreground">
                {stat.value === null ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  stat.value
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
