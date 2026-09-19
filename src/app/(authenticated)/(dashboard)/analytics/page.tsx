"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AnalyticsHeader } from '@/features/analytics/components/layout/AnalyticsHeader'
import { AnalyticsTabs } from '@/features/analytics/components/layout/AnalyticsTabs'
import { CareerTrajectoryHome } from '@/features/analytics/components/career-trajectory/CareerTrajectoryHome'
import { ProfileAnalyticsHome } from '@/features/analytics/components/profile-analytics/ProfileAnalyticsHome'
import { useAnalyticsStore } from '@/store/analytics.store'
import { FeatureGuard } from "@/components/feature-flags"

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const { mainTab } = useAnalyticsStore()
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Extract first name from session; fall back gracefully
  const fullName: string = (session?.user as any)?.name ?? (session?.user as any)?.firstName ?? ''
  const userName = fullName.split(' ')[0] || 'there'

  return (
    <FeatureGuard featureKey="enableAnalyticsTab" moduleName="Analytics">
      <div className="min-h-screen bg-background w-full">
        <div className="w-full max-w-[998px] mx-auto py-8">
          <div className="flex flex-col items-start w-full max-w-[960px] gap-6">
          
            {/* Header Section */}
            <AnalyticsHeader userName={userName} />

            {/* Top-level Tabs */}
            <AnalyticsTabs />

            {/* Tab Content */}
            {mainTab === 'career-trajectory' ? (
              <CareerTrajectoryHome />
            ) : (
              <ProfileAnalyticsHome />
            )}
          </div>
        </div>
      </div>
    </FeatureGuard>
  )
}
