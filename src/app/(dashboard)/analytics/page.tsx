'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import {
  getOverviewStats,
  getEngagementData,
  getAudienceIndustries,
  getAudienceLocations,
  getFunnelData,
  TARGET_ROLES,
  getSkillGapData,
  SkillData
} from '@/app/(dashboard)/analytics/data'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/services/api/dashboard'

import { SkillGapVisualizer } from '@/components/analytics/SkillGapVisualizer'
import { OverviewStats } from '@/components/analytics/OverviewStats'
import { EngagementMetrics } from '@/components/analytics/EngagementMetrics'
import { AudienceInsights } from '@/components/analytics/AudienceInsights'
import { RecruiterFunnel } from '@/components/analytics/RecruiterFunnel'

export type TimeRange = '7d' | '30d' | '90d' | 'all'

export default function AnalyticsPage() {
  const router = useRouter()
  // Removed useTheme
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
    }
    router.push(routes[page] ?? '/feed')
  }

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => getDashboardStats(),
  });

  // Derived Data based on TimeRange
  const overviewStats = useMemo(() => {
    const stats = getOverviewStats(timeRange);
    
    // Find the statistics that should be real
    const viewStat = stats.find(s => s.label === 'Profile Views');
    
    if (dashboardData?.overview) {
      if (viewStat) {
        viewStat.value = dashboardData.overview.totalViews.toLocaleString();
      }
    } else if (viewStat) {
      // Set to null while loading to trigger skeleton in OverviewStats
      viewStat.value = null;
    }
    
    return stats;
  }, [timeRange, dashboardData])

  const engagementData = useMemo(() => getEngagementData(timeRange), [timeRange])
  const funnelData = useMemo(() => getFunnelData(timeRange), [timeRange])

  // Static for now, but could be dynamic
  const audienceIndustries = useMemo(() => getAudienceIndustries(), [])
  const audienceLocations = useMemo(() => getAudienceLocations(), [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your professional growth and reach
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center p-1 rounded-lg border bg-card border-border">
            {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === range
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
            <OverviewStats stats={overviewStats} />
          </div>

          {/* Second Row: Skill Gap (The WOW Feature) */}
          <div className="lg:col-span-12">
            <SkillGapVisualizer />
          </div>

          {/* Third Row: Engagement & Funnel */}
          <div className="lg:col-span-8">
            <EngagementMetrics data={engagementData} />
          </div>
          <div className="lg:col-span-4">
            <RecruiterFunnel data={funnelData} />
          </div>

          {/* Fourth Row: Audience Insights */}
          <div className="lg:col-span-12">
            <AudienceInsights
              industries={audienceIndustries}
              locations={audienceLocations}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
