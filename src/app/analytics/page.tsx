'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { AppShell } from '@/components/layout/AppShell'
import { useRouter } from 'next/navigation'
import {
  getOverviewStats,
  getEngagementData,
  getAudienceIndustries,
  getAudienceLocations,
  getFunnelData
} from '@/app/analytics/data'

import { SkillGapVisualizer } from '@/components/analytics/SkillGapVisualizer'
import { OverviewStats } from '@/components/analytics/OverviewStats'
import { EngagementMetrics } from '@/components/analytics/EngagementMetrics'
import { AudienceInsights } from '@/components/analytics/AudienceInsights'
import { RecruiterFunnel } from '@/components/analytics/RecruiterFunnel'

export type TimeRange = '7d' | '30d' | '90d' | 'all'

export default function AnalyticsPage() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigateTo = (page: string) => {
    const routes: Record<string, string> = {
      home: '/feed',
      network: '/showcase',
      events: '/events',
      profile: '/profile',
      settings: '/settings',
      jobs: '/jobs',
      analytics: '/analytics',
      achievements: '/achievements',
    }
    router.push(routes[page] ?? '/feed')
  }

  // Derived Data based on TimeRange
  const overviewStats = useMemo(() => getOverviewStats(timeRange), [timeRange])
  const engagementData = useMemo(() => getEngagementData(timeRange), [timeRange])
  const funnelData = useMemo(() => getFunnelData(timeRange), [timeRange])

  // Static for now, but could be dynamic
  const audienceIndustries = useMemo(() => getAudienceIndustries(), [])
  const audienceLocations = useMemo(() => getAudienceLocations(), [])

  if (!mounted) {
    return null
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#171c28]' : 'bg-[#F3F2EF]'}`}>
      <AppShell currentPage="analytics" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Analytics Dashboard
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Track your professional growth and reach
              </p>
            </div>

            {/* Time Range Selector */}
            <div className={`flex items-center p-1 rounded-lg border ${isDark ? 'bg-[#242b3d] border-[#2d3548]' : 'bg-white border-gray-200'}`}>
              {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    timeRange === range
                      ? 'bg-[#5B7CFF] text-white shadow-sm'
                      : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range === 'all' ? 'All Time' : `Last ${range.replace('d', ' Days')}`}
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Top Row: Overview Stats */}
            <div className="lg:col-span-12">
               <OverviewStats stats={overviewStats} isDark={isDark} />
            </div>

            {/* Second Row: Skill Gap (The WOW Feature) */}
            <div className="lg:col-span-12">
               <SkillGapVisualizer />
            </div>

            {/* Third Row: Engagement & Funnel */}
            <div className="lg:col-span-8">
              <EngagementMetrics data={engagementData} isDark={isDark} />
            </div>
            <div className="lg:col-span-4">
              <RecruiterFunnel data={funnelData} isDark={isDark} />
            </div>

            {/* Fourth Row: Audience Insights */}
            <div className="lg:col-span-12">
              <AudienceInsights
                industries={audienceIndustries}
                locations={audienceLocations}
                isDark={isDark}
              />
            </div>

          </div>
        </div>
      </AppShell>
    </div>
  )
}
