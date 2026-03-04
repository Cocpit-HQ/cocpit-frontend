'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, User, Calendar, Briefcase, Users, Rss } from 'lucide-react'

import {
    DateRange,
    getKpiMetrics,
    getDailyViews,
    getWeeklyComparison,
    getEventKpis,
    getEventPostingTrend,
    getEventRegistrations,
    getTopEvents,
    getJobKpis,
    getJobPostingTrend,
    getJobApplications,
    getTopJobs,
    getFollowerKpis,
    getFollowerGrowth,
    getAudienceByIndustry,
    getAudienceByLocation,
    getAudienceBySeniority,
    getContentKpis,
    getContentEngagement,
    getTopPosts,
    getActivityHeatmap,
} from '@/app/(dashboard)/company-analytics/data'

import { CompanyKpiCards } from '@/components/company-analytics/CompanyKpiCards'
import { DailyViewsChart } from '@/components/company-analytics/DailyViewsChart'
import { WeeklyComparisonChart } from '@/components/company-analytics/WeeklyComparisonChart'
import { EventKpiCards } from '@/components/company-analytics/EventKpiCards'
import { EventPostingTrendChart } from '@/components/company-analytics/EventPostingTrendChart'
import { EventRegistrationChart } from '@/components/company-analytics/EventRegistrationChart'
import { TopEventsTable } from '@/components/company-analytics/TopEventsTable'
import { JobKpiCards } from '@/components/company-analytics/JobKpiCards'
import { JobPostingTrendChart } from '@/components/company-analytics/JobPostingTrendChart'
import { JobApplicationChart } from '@/components/company-analytics/JobApplicationChart'
import { TopJobsTable } from '@/components/company-analytics/TopJobsTable'
import { FollowerKpiCards } from '@/components/company-analytics/FollowerKpiCards'
import { FollowerGrowthChart } from '@/components/company-analytics/FollowerGrowthChart'
import { AudienceBreakdown } from '@/components/company-analytics/AudienceBreakdown'
import { ContentKpiCards } from '@/components/company-analytics/ContentKpiCards'
import { ContentEngagementChart } from '@/components/company-analytics/ContentEngagementChart'
import { TopPostsTable } from '@/components/company-analytics/TopPostsTable'
import { ActivityHeatmap } from '@/components/company-analytics/ActivityHeatmap'
import { AnalyticsSkeleton } from '@/components/company-analytics/AnalyticsSkeleton'

type TabKey = 'profile' | 'events' | 'jobs' | 'followers' | 'content'

const DATE_RANGES: { value: DateRange; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
]

const TABS: { key: TabKey; label: string; icon: React.ElementType; accent: string }[] = [
    { key: 'profile', label: 'Profile', icon: User, accent: 'bg-primary' },
    { key: 'events', label: 'Events', icon: Calendar, accent: 'bg-violet-500' },
    { key: 'jobs', label: 'Jobs', icon: Briefcase, accent: 'bg-cyan-500' },
    { key: 'followers', label: 'Followers', icon: Users, accent: 'bg-emerald-500' },
    { key: 'content', label: 'Content', icon: Rss, accent: 'bg-amber-500' },
]

export default function CompanyAnalyticsPage() {
    const [mounted, setMounted] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange>('30d')
    const [activeTab, setActiveTab] = useState<TabKey>('profile')

    useEffect(() => {
        setMounted(true)
    }, [])

    // ─── Profile Data
    const kpiMetrics = useMemo(() => getKpiMetrics(dateRange), [dateRange])
    const dailyViews = useMemo(() => getDailyViews(dateRange), [dateRange])
    const weeklyComparison = useMemo(() => getWeeklyComparison(), [])

    // ─── Event Data
    const eventKpis = useMemo(() => getEventKpis(dateRange), [dateRange])
    const eventPostingTrend = useMemo(() => getEventPostingTrend(dateRange), [dateRange])
    const eventRegistrations = useMemo(() => getEventRegistrations(), [])
    const topEvents = useMemo(() => getTopEvents(), [])

    // ─── Job Data
    const jobKpis = useMemo(() => getJobKpis(dateRange), [dateRange])
    const jobPostingTrend = useMemo(() => getJobPostingTrend(dateRange), [dateRange])
    const jobApplications = useMemo(() => getJobApplications(), [])
    const topJobs = useMemo(() => getTopJobs(), [])

    // ─── Follower Data
    const followerKpis = useMemo(() => getFollowerKpis(dateRange), [dateRange])
    const followerGrowth = useMemo(() => getFollowerGrowth(dateRange), [dateRange])
    const audienceIndustry = useMemo(() => getAudienceByIndustry(), [])
    const audienceLocation = useMemo(() => getAudienceByLocation(), [])
    const audienceSeniority = useMemo(() => getAudienceBySeniority(), [])

    // ─── Content Data
    const contentKpis = useMemo(() => getContentKpis(dateRange), [dateRange])
    const contentEngagement = useMemo(() => getContentEngagement(dateRange), [dateRange])
    const topPosts = useMemo(() => getTopPosts(), [])

    // ─── Activity Heatmap Data (shared)
    const activityData = useMemo(() => getActivityHeatmap(), [])

    if (!mounted) {
        return <AnalyticsSkeleton />
    }

    const sectionAccents: Record<TabKey, string> = {
        profile: 'bg-primary',
        events: 'bg-violet-500',
        jobs: 'bg-cyan-500',
        followers: 'bg-emerald-500',
        content: 'bg-amber-500',
    }

    const sectionTitles: Record<TabKey, { title: string; subtitle: string }> = {
        profile: { title: 'Profile Performance', subtitle: 'Track profile views and engagement' },
        events: { title: 'Event Performance', subtitle: 'Track event registrations and reach' },
        jobs: { title: 'Job Performance', subtitle: 'Track job applications and hiring pipeline' },
        followers: { title: 'Follower Insights', subtitle: 'Understand your audience and growth' },
        content: { title: 'Content Performance', subtitle: 'Track post engagement and reach' },
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ─── Header ─────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                            <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                Company Analytics
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Track your company&apos;s performance and engagement
                            </p>
                        </div>
                    </div>

                    {/* Date Range Selector */}
                    <div className="flex items-center p-1 rounded-xl border border-border bg-card shadow-sm">
                        {DATE_RANGES.map((range) => (
                            <button
                                key={range.value}
                                onClick={() => setDateRange(range.value)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${dateRange === range.value
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ─── Section Tabs ────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-10"
                >
                    <div className="flex items-center p-1 rounded-xl border border-border bg-card shadow-sm w-fit overflow-x-auto">
                        {TABS.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.key
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                                        ${isActive
                                            ? `${tab.accent} text-white shadow-sm`
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </motion.div>

                {/* ─── Tab Content ─────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* KPI Cards */}
                        <section className="mb-10">
                            {activeTab === 'profile' && <CompanyKpiCards metrics={kpiMetrics} />}
                            {activeTab === 'events' && <EventKpiCards metrics={eventKpis} />}
                            {activeTab === 'jobs' && <JobKpiCards metrics={jobKpis} />}
                            {activeTab === 'followers' && <FollowerKpiCards metrics={followerKpis} />}
                            {activeTab === 'content' && <ContentKpiCards metrics={contentKpis} />}
                        </section>

                        {/* Section Header */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="flex items-center gap-2 mb-6"
                        >
                            <div className={`w-1 h-6 rounded-full ${sectionAccents[activeTab]}`} />
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {sectionTitles[activeTab].title}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {sectionTitles[activeTab].subtitle}
                                </p>
                            </div>
                        </motion.div>

                        {/* Charts Grid */}
                        <section className="mb-8">
                            {activeTab === 'profile' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <DailyViewsChart data={dailyViews} />
                                    <WeeklyComparisonChart data={weeklyComparison} />
                                </div>
                            )}
                            {activeTab === 'events' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <EventPostingTrendChart data={eventPostingTrend} />
                                    <EventRegistrationChart data={eventRegistrations} />
                                </div>
                            )}
                            {activeTab === 'jobs' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <JobPostingTrendChart data={jobPostingTrend} />
                                    <JobApplicationChart data={jobApplications} />
                                </div>
                            )}
                            {activeTab === 'followers' && (
                                <div className="space-y-6">
                                    <FollowerGrowthChart data={followerGrowth} />
                                    <AudienceBreakdown
                                        industry={audienceIndustry}
                                        location={audienceLocation}
                                        seniority={audienceSeniority}
                                    />
                                </div>
                            )}
                            {activeTab === 'content' && (
                                <div className="space-y-6">
                                    <ContentEngagementChart data={contentEngagement} />
                                </div>
                            )}
                        </section>

                        {/* Top Performers Tables */}
                        {activeTab === 'events' && (
                            <section className="mb-8">
                                <TopEventsTable data={topEvents} />
                            </section>
                        )}
                        {activeTab === 'jobs' && (
                            <section className="mb-8">
                                <TopJobsTable data={topJobs} />
                            </section>
                        )}
                        {activeTab === 'content' && (
                            <section className="mb-8">
                                <TopPostsTable data={topPosts} />
                            </section>
                        )}

                        {/* ─── Activity Heatmap (Shared across all tabs) ──── */}
                        <section className="mt-12">
                            <ActivityHeatmap data={activityData} />
                        </section>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
