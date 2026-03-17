'use client'

import React, { useState, useEffect, useMemo, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, User, Calendar, Briefcase, Users, Rss, ChevronDown, Download, LayoutDashboard } from 'lucide-react'
import { useActiveProfile } from '@/context/ActiveProfileContext'

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
    getInsights,
} from '@/app/(dashboard)/company-analytics/data'

import { OrganizationKpiCards } from '@/components/organization-analytics/OrganizationKpiCards'
import { DailyViewsChart } from '@/components/organization-analytics/DailyViewsChart'
import { WeeklyComparisonChart } from '@/components/organization-analytics/WeeklyComparisonChart'
import { EventKpiCards } from '@/components/organization-analytics/EventKpiCards'
import { EventPostingTrendChart } from '@/components/organization-analytics/EventPostingTrendChart'
import { EventRegistrationChart } from '@/components/organization-analytics/EventRegistrationChart'
import { TopEventsTable } from '@/components/organization-analytics/TopEventsTable'
import { JobKpiCards } from '@/components/organization-analytics/JobKpiCards'
import { JobPostingTrendChart } from '@/components/organization-analytics/JobPostingTrendChart'
import { JobApplicationChart } from '@/components/organization-analytics/JobApplicationChart'
import { TopJobsTable } from '@/components/organization-analytics/TopJobsTable'
import { FollowerKpiCards } from '@/components/organization-analytics/FollowerKpiCards'
import { FollowerGrowthChart } from '@/components/organization-analytics/FollowerGrowthChart'
import { AudienceBreakdown } from '@/components/organization-analytics/AudienceBreakdown'
import { ContentKpiCards } from '@/components/organization-analytics/ContentKpiCards'
import { ContentEngagementChart } from '@/components/organization-analytics/ContentEngagementChart'
import { TopPostsTable } from '@/components/organization-analytics/TopPostsTable'
import { ActivityHeatmap } from '@/components/organization-analytics/ActivityHeatmap'
import { AnalyticsSkeleton } from '@/components/organization-analytics/AnalyticsSkeleton'
import { InsightsPanel } from '@/components/organization-analytics/InsightsPanel'
import { SharesVsViewsChart } from '@/components/organization-analytics/SharesVsViewsChart'

type TabKey = 'overview' | 'profile' | 'content' | 'jobs' | 'followers' | 'events'

const DATE_RANGES: { value: DateRange; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
]

const TABS: { key: TabKey; label: string; icon: React.ElementType; accent: string }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard, accent: 'bg-indigo-500' },
    { key: 'profile', label: 'Profile', icon: User, accent: 'bg-primary' },
    { key: 'content', label: 'Content', icon: Rss, accent: 'bg-amber-500' },
    { key: 'jobs', label: 'Jobs', icon: Briefcase, accent: 'bg-cyan-500' },
    { key: 'followers', label: 'Followers', icon: Users, accent: 'bg-emerald-500' },
    { key: 'events', label: 'Events', icon: Calendar, accent: 'bg-violet-500' },
]

import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/services/api/dashboard'
import { companyService } from '@/services/organization.service'

export default function AnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [mounted, setMounted] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange>('30d')
    const [activeTab, setActiveTab] = useState<TabKey>('overview')
    const { activeProfile } = useActiveProfile()

    const { data: company } = useQuery({
        queryKey: ['company', slug],
        queryFn: () => companyService.getCompany(slug),
    });

    const { data: dashboardData } = useQuery({
        queryKey: ['dashboardStats', company?.org_id || company?.company_id],
        queryFn: () => getDashboardStats(company?.org_id || company?.company_id, 'organization'),
        enabled: !!(company?.org_id || company?.company_id),
    });

    useEffect(() => {
        setMounted(true)
    }, [])

    // ─── Profile Data
    const kpiMetrics = useMemo(() => {
        const metrics = getKpiMetrics(dateRange);
        if (dashboardData?.overview) {
            const viewsMetric = metrics.find(m => m.id === 'profile-views');
            if (viewsMetric) {
                viewsMetric.value = dashboardData.overview.totalViews;
            }
            const followersMetric = metrics.find(m => m.id === 'followers');
            if (followersMetric) {
                followersMetric.value = dashboardData.overview.totalConnections;
            }
        } else {
            // Set to null while loading to trigger skeleton in KPI cards
            const metricsToReset = ['profile-views', 'followers'];
            metricsToReset.forEach(id => {
                const m = metrics.find(metric => metric.id === id);
                if (m) m.value = null;
            });
        }
        return metrics;
    }, [dateRange, dashboardData])
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

    // ─── Shared / General Data
    const activityData = useMemo(() => getActivityHeatmap(), [])
    const insights = useMemo(() => getInsights(), [])

    if (!mounted) {
        return <AnalyticsSkeleton />
    }

    const sectionAccents: Record<TabKey, string> = {
        overview: 'bg-indigo-500',
        profile: 'bg-primary',
        events: 'bg-violet-500',
        jobs: 'bg-cyan-500',
        followers: 'bg-emerald-500',
        content: 'bg-amber-500',
    }

    const sectionTitles: Record<TabKey, { title: string; subtitle: string }> = {
        overview: { title: 'Dashboard Overview', subtitle: 'Key metrics and insights at a glance' },
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

                    {/* Actions & Filters */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                title="Date Range"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as DateRange)}
                                className="appearance-none pl-4 pr-10 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 hover:border-border/80 transition-colors cursor-pointer"
                            >
                                {DATE_RANGES.map(range => (
                                    <option key={range.value} value={range.value}>{range.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>

                        <button
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-xl transition-colors shadow-sm"
                            onClick={() => console.log('Export triggered')}
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </div>
                </motion.div>

                {/* ─── Section Tabs ────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-10"
                >
                    <div className="flex items-center p-1 rounded-xl border border-border bg-card shadow-sm w-fit overflow-x-auto smooth-scroll">
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
                        {/* Overview Tab Content */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8 flex flex-col w-full">
                                {/* Row 1: KPI Cards */}
                                <section>
                                    <OrganizationKpiCards metrics={kpiMetrics} />
                                </section>

                                {/* Row 2: Main Chart (Full Width) */}
                                <section>
                                    <DailyViewsChart data={dailyViews} />
                                </section>

                                {/* Row 3: Shares vs Views | Follower Growth */}
                                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                                    <SharesVsViewsChart data={weeklyComparison} />
                                    <FollowerGrowthChart data={followerGrowth} />
                                </section>

                                {/* Row 4: Activity Heatmap */}
                                <section>
                                    <ActivityHeatmap data={activityData} />
                                </section>

                                {/* Row 5: Insights Panel */}
                                <section>
                                    <InsightsPanel insights={insights} />
                                </section>
                            </div>
                        )}

                        {/* Other Tabs KPI Cards */}
                        {activeTab !== 'overview' && (
                            <>
                                <section className="mb-10">
                                    {activeTab === 'profile' && <OrganizationKpiCards metrics={kpiMetrics} />}
                                    {activeTab === 'events' && <EventKpiCards metrics={eventKpis} />}
                                    {activeTab === 'jobs' && <JobKpiCards metrics={jobKpis} />}
                                    {activeTab === 'followers' && <FollowerKpiCards metrics={followerKpis} />}
                                    {activeTab === 'content' && <ContentKpiCards metrics={contentKpis} />}
                                </section>

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
                            </>
                        )}

                        {/* Charts Grid */}
                        {activeTab !== 'overview' && (
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
                        )}

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

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
