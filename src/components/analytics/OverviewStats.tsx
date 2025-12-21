'use client'

import React from 'react'
import { Eye, Search, UserPlus, MessageSquare, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { OverviewStat } from '@/app/analytics/data'

interface OverviewStatsProps {
  stats: OverviewStat[]
  isDark: boolean
}

const icons = {
  Eye,
  Search,
  UserPlus,
  MessageSquare
}

export function OverviewStats({ stats, isDark }: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = icons[stat.iconName]
        const isPositive = stat.trend === 'up'
        const isNeutral = stat.trend === 'neutral'

        return (
          <div
            key={index}
            className={`p-5 rounded-xl border transition-all hover:shadow-md
              ${isDark
                ? 'bg-[#242b3d] border-[#2d3548] hover:border-[#3d465c]'
                : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-lg ${isDark ? 'bg-[#1a1f2e] text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
                ${isNeutral
                  ? isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                  : isPositive
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>

            <div>
              <h3 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {stat.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
