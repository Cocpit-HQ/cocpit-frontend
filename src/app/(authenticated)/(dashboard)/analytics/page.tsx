"use client"

import React, { useState, useEffect } from 'react'
import { AnalyticsHeader } from '@/features/analytics/components/layout/AnalyticsHeader'
import { AnalyticsTabs, AnalyticsTabType } from '@/features/analytics/components/layout/AnalyticsTabs'
import { CareerTrajectoryHome } from '@/features/analytics/components/career-trajectory/CareerTrajectoryHome'
import { ProfileAnalyticsHome } from '@/features/analytics/components/profile-analytics/ProfileAnalyticsHome'

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<AnalyticsTabType>('career-trajectory')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="w-full max-w-[998px] mx-auto py-8">
        <div className="flex flex-col items-start w-full max-w-[960px] gap-6">
        
          {/* Header Section */}
          <AnalyticsHeader userName="Alexandra" />

          {/* Top-level Tabs */}
          <AnalyticsTabs 
            activeTab={activeTab} 
            onTabChange={(tab) => setActiveTab(tab)} 
          />

          {/* Tab Content */}
          {activeTab === 'career-trajectory' ? (
            <CareerTrajectoryHome />
          ) : (
            <ProfileAnalyticsHome />
          )}
        </div>
      </div>
    </div>
  )
}
