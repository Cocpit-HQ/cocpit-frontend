// ─── Types ───────────────────────────────────────────────────────────────────

export type DateRange = '7d' | '30d' | '90d' | '1y' | 'custom'

// Helpers
const generateSparkline = () => Array.from({ length: 14 }, () => ({ value: Math.max(10, Math.floor(Math.random() * 50) + 20) }))
const getComparisonText = (range: DateRange) => range === '7d' ? 'vs last week' : range === '30d' ? 'vs last month' : range === '90d' ? 'vs previous quarter' : 'vs previous period'

export interface KpiMetric {
    id: string
    label: string
    value: number | null
    change: number        // percentage change, e.g. +12.5 or -3.2
    trend: 'up' | 'down'
    icon: 'Eye' | 'Share2' | 'Users' | 'MessageCircle' | 'Bell' | 'TrendingUp' | 'Search'
    color: string         // Tailwind-compatible color class
    accentHex: string     // hex for icon bg glow
    comparisonText?: string
    sparklineData?: { value: number }[]
}

export interface DailyViewPoint {
    date: string
    views: number
}

export interface WeeklyComparisonPoint {
    week: string
    views: number
    shares: number
}

// ─── Mock Data Generators ────────────────────────────────────────────────────

export const getKpiMetrics = (range: DateRange): KpiMetric[] => {
    const multipliers: Record<DateRange, number> = {
        '7d': 1,
        '30d': 3.8,
        '90d': 10.5,
        '1y': 42.0,
        'custom': 15.0,
    }
    const m = multipliers[range]

    return [
        {
            id: 'profile-views',
            label: 'Total Profile Views',
            value: Math.floor(12_480 * m),
            change: 12.5,
            trend: 'up',
            icon: 'Eye',
            color: 'text-blue-500',
            accentHex: '#3b82f6',
        },
        {
            id: 'profile-shares',
            label: 'Total Profile Shares',
            value: Math.floor(3_240 * m),
            change: 8.3,
            trend: 'up',
            icon: 'Share2',
            color: 'text-violet-500',
            accentHex: '#8b5cf6',
        },
        {
            id: 'followers',
            label: 'Total Followers',
            value: Math.floor(18_920 * m),
            change: 5.7,
            trend: 'up',
            icon: 'Users',
            color: 'text-emerald-500',
            accentHex: '#10b981',
        },
        {
            id: 'growth',
            label: 'Growth (30d)',
            value: 24.8,
            change: 4.2,
            trend: 'up',
            icon: 'TrendingUp',
            color: 'text-primary',
            accentHex: '#3b82f6',
        },
    ].map(m => ({ ...m, comparisonText: getComparisonText(range), sparklineData: generateSparkline() })) as KpiMetric[]
}

// 30-day daily views data
export const getDailyViews = (range: DateRange): DailyViewPoint[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const data: DailyViewPoint[] = []

    for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (days - i - 1))

        // Create a realistic wave pattern with upward trend
        const base = 320 + i * 4
        const wave = Math.sin(i * 0.45) * 80
        const noise = (Math.random() - 0.5) * 60
        const spike = i % 7 === 0 ? 120 : 0 // Weekly spikes

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: Math.max(150, Math.floor(base + wave + noise + spike)),
        })
    }

    return data
}

// 4-week comparison data
export const getWeeklyComparison = (): WeeklyComparisonPoint[] => [
    { week: 'Week 1', views: 2_840, shares: 680 },
    { week: 'Week 2', views: 3_120, shares: 750 },
    { week: 'Week 3', views: 2_960, shares: 820 },
    { week: 'Week 4', views: 3_580, shares: 910 },
]

// ─── Event Analytics Types ───────────────────────────────────────────────────

export interface EventKpiMetric {
    id: string
    label: string
    value: number
    change: number
    trend: 'up' | 'down'
    icon: 'CalendarPlus' | 'UserCheck' | 'Eye' | 'TrendingUp'
    color: string
    accentHex: string
    comparisonText?: string
    sparklineData?: { value: number }[]
}

export interface EventPostingPoint {
    date: string
    events: number
}

export interface EventRegistrationPoint {
    week: string
    registrations: number
    views: number
}

export interface TopEvent {
    name: string
    registrations: number
    views: number
    conversionRate: number
}

// ─── Event Mock Data Generators ──────────────────────────────────────────────

export const getEventKpis = (range: DateRange): EventKpiMetric[] => {
    const multipliers: Record<DateRange, number> = { '7d': 1, '30d': 3.5, '90d': 9.2, '1y': 38.0, 'custom': 14.0 }
    const m = multipliers[range]

    return [
        {
            id: 'events-posted',
            label: 'Total Events Posted',
            value: Math.floor(48 * m),
            change: 18.4,
            trend: 'up',
            icon: 'CalendarPlus',
            color: 'text-violet-500',
            accentHex: '#8b5cf6',
        },
        {
            id: 'total-registrations',
            label: 'Total Registrations',
            value: Math.floor(2_860 * m),
            change: 12.7,
            trend: 'up',
            icon: 'UserCheck',
            color: 'text-purple-500',
            accentHex: '#a855f7',
        },
        {
            id: 'event-views',
            label: 'Total Event Views',
            value: Math.floor(9_450 * m),
            change: 8.9,
            trend: 'up',
            icon: 'Eye',
            color: 'text-fuchsia-500',
            accentHex: '#d946ef',
        },
        {
            id: 'registration-growth',
            label: 'Reg. Growth (30d)',
            value: 22.3,
            change: 5.1,
            trend: 'up',
            icon: 'TrendingUp',
            color: 'text-violet-400',
            accentHex: '#a78bfa',
        },
    ].map(m => ({ ...m, comparisonText: getComparisonText(range), sparklineData: generateSparkline() })) as EventKpiMetric[]
}

export const getEventPostingTrend = (range: DateRange): EventPostingPoint[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const data: EventPostingPoint[] = []

    for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (days - i - 1))
        const base = 1 + Math.sin(i * 0.3) * 1.5
        const noise = Math.random() * 2
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            events: Math.max(0, Math.floor(base + noise)),
        })
    }
    return data
}

export const getEventRegistrations = (): EventRegistrationPoint[] => [
    { week: 'Week 1', registrations: 420, views: 1_840 },
    { week: 'Week 2', registrations: 580, views: 2_120 },
    { week: 'Week 3', registrations: 510, views: 1_960 },
    { week: 'Week 4', registrations: 720, views: 2_580 },
]

export const getTopEvents = (): TopEvent[] => [
    { name: 'AI in Product Design Summit', registrations: 342, views: 1_820, conversionRate: 18.8 },
    { name: 'Frontend Architecture Workshop', registrations: 285, views: 1_540, conversionRate: 18.5 },
    { name: 'Startup Pitch Night', registrations: 198, views: 1_250, conversionRate: 15.8 },
    { name: 'Design Systems Masterclass', registrations: 176, views: 980, conversionRate: 18.0 },
    { name: 'Cloud Infrastructure Webinar', registrations: 145, views: 890, conversionRate: 16.3 },
]

// ─── Job Analytics Types ─────────────────────────────────────────────────────

export interface JobKpiMetric {
    id: string
    label: string
    value: number
    change: number
    trend: 'up' | 'down'
    icon: 'Briefcase' | 'FileText' | 'Eye' | 'TrendingUp'
    color: string
    accentHex: string
    comparisonText?: string
    sparklineData?: { value: number }[]
}

export interface JobPostingPoint {
    date: string
    jobs: number
}

export interface JobApplicationPoint {
    week: string
    applications: number
    views: number
}

export interface TopJob {
    title: string
    applications: number
    views: number
    conversionRate: number
}

// ─── Job Mock Data Generators ────────────────────────────────────────────────

export const getJobKpis = (range: DateRange): JobKpiMetric[] => {
    const multipliers: Record<DateRange, number> = { '7d': 1, '30d': 3.2, '90d': 8.8, '1y': 36.0, 'custom': 13.0 }
    const m = multipliers[range]

    return [
        {
            id: 'jobs-posted',
            label: 'Total Jobs Posted',
            value: Math.floor(36 * m),
            change: 14.2,
            trend: 'up',
            icon: 'Briefcase',
            color: 'text-cyan-500',
            accentHex: '#06b6d4',
        },
        {
            id: 'total-applications',
            label: 'Total Applications',
            value: Math.floor(4_580 * m),
            change: 21.5,
            trend: 'up',
            icon: 'FileText',
            color: 'text-teal-500',
            accentHex: '#14b8a6',
        },
        {
            id: 'job-views',
            label: 'Total Job Views',
            value: Math.floor(15_200 * m),
            change: 9.8,
            trend: 'up',
            icon: 'Eye',
            color: 'text-sky-500',
            accentHex: '#0ea5e9',
        },
        {
            id: 'application-growth',
            label: 'App. Growth (30d)',
            value: 28.6,
            change: 7.3,
            trend: 'up',
            icon: 'TrendingUp',
            color: 'text-cyan-400',
            accentHex: '#22d3ee',
        },
    ].map(m => ({ ...m, comparisonText: getComparisonText(range), sparklineData: generateSparkline() })) as JobKpiMetric[]
}

export const getJobPostingTrend = (range: DateRange): JobPostingPoint[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const data: JobPostingPoint[] = []

    for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (days - i - 1))
        const base = 1 + Math.sin(i * 0.25) * 1.2
        const noise = Math.random() * 1.5
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            jobs: Math.max(0, Math.floor(base + noise)),
        })
    }
    return data
}

export const getJobApplications = (): JobApplicationPoint[] => [
    { week: 'Week 1', applications: 680, views: 3_240 },
    { week: 'Week 2', applications: 820, views: 3_580 },
    { week: 'Week 3', applications: 750, views: 3_120 },
    { week: 'Week 4', applications: 960, views: 4_080 },
]

export const getTopJobs = (): TopJob[] => [
    { title: 'Senior Frontend Engineer', applications: 245, views: 1_680, conversionRate: 14.6 },
    { title: 'Product Designer', applications: 198, views: 1_420, conversionRate: 13.9 },
    { title: 'Full-Stack Developer', applications: 176, views: 1_350, conversionRate: 13.0 },
    { title: 'DevOps Engineer', applications: 142, views: 980, conversionRate: 14.5 },
    { title: 'Marketing Manager', applications: 118, views: 860, conversionRate: 13.7 },
]

// ─── Follower & Audience Types ───────────────────────────────────────────────

export interface FollowerKpiMetric {
    id: string
    label: string
    value: number
    change: number
    trend: 'up' | 'down'
    icon: 'Users' | 'UserPlus' | 'TrendingUp' | 'Activity'
    color: string
    accentHex: string
    comparisonText?: string
    sparklineData?: { value: number }[]
}

export interface FollowerGrowthPoint {
    date: string
    followers: number
    unfollows: number
}

export interface AudienceSegment {
    label: string
    value: number
    color: string
}

// ─── Follower Mock Data Generators ───────────────────────────────────────────

export const getFollowerKpis = (range: DateRange): FollowerKpiMetric[] => {
    const multipliers: Record<DateRange, number> = { '7d': 1, '30d': 3.8, '90d': 10.2, '1y': 44.0, 'custom': 16.0 }
    const m = multipliers[range]

    return [
        {
            id: 'total-followers',
            label: 'Total Followers',
            value: Math.floor(18_920 * m),
            change: 8.4,
            trend: 'up',
            icon: 'Users',
            color: 'text-emerald-500',
            accentHex: '#10b981',
        },
        {
            id: 'new-followers',
            label: 'New Followers',
            value: Math.floor(1_240 * m),
            change: 12.6,
            trend: 'up',
            icon: 'UserPlus',
            color: 'text-green-500',
            accentHex: '#22c55e',
        },
        {
            id: 'follower-growth',
            label: 'Growth Rate',
            value: 15.8,
            change: 3.2,
            trend: 'up',
            icon: 'TrendingUp',
            color: 'text-teal-500',
            accentHex: '#14b8a6',
        },
        {
            id: 'daily-avg-follows',
            label: 'Avg. Daily Follows',
            value: Math.floor(42 * (range === '7d' ? 1 : range === '30d' ? 1.2 : 1.1)),
            change: 6.8,
            trend: 'up',
            icon: 'Activity',
            color: 'text-emerald-400',
            accentHex: '#34d399',
        },
    ].map(m => ({ ...m, comparisonText: getComparisonText(range), sparklineData: generateSparkline() })) as FollowerKpiMetric[]
}

export const getFollowerGrowth = (range: DateRange): FollowerGrowthPoint[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const data: FollowerGrowthPoint[] = []

    for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (days - i - 1))
        const base = 30 + i * 1.5
        const wave = Math.sin(i * 0.35) * 15
        const noise = (Math.random() - 0.3) * 10
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            followers: Math.max(5, Math.floor(base + wave + noise)),
            unfollows: Math.max(0, Math.floor(5 + Math.random() * 8)),
        })
    }
    return data
}

export const getAudienceByIndustry = (): AudienceSegment[] => [
    { label: 'Technology', value: 34, color: '#10b981' },
    { label: 'Finance', value: 18, color: '#22c55e' },
    { label: 'Healthcare', value: 14, color: '#14b8a6' },
    { label: 'Education', value: 12, color: '#34d399' },
    { label: 'Marketing', value: 11, color: '#6ee7b7' },
    { label: 'Other', value: 11, color: '#4ade80' },
]

export const getAudienceByLocation = (): AudienceSegment[] => [
    { label: 'United States', value: 28, color: '#10b981' },
    { label: 'India', value: 22, color: '#22c55e' },
    { label: 'United Kingdom', value: 15, color: '#14b8a6' },
    { label: 'Germany', value: 12, color: '#34d399' },
    { label: 'Canada', value: 10, color: '#6ee7b7' },
    { label: 'Other', value: 13, color: '#4ade80' },
]

export const getAudienceBySeniority = (): AudienceSegment[] => [
    { label: 'Senior', value: 30, color: '#10b981' },
    { label: 'Mid-Level', value: 28, color: '#22c55e' },
    { label: 'Entry-Level', value: 18, color: '#14b8a6' },
    { label: 'Director', value: 12, color: '#34d399' },
    { label: 'VP / C-Level', value: 7, color: '#6ee7b7' },
    { label: 'Intern', value: 5, color: '#4ade80' },
]

// ─── Content / Feed Types ────────────────────────────────────────────────────

export interface ContentKpiMetric {
    id: string
    label: string
    value: number
    change: number
    trend: 'up' | 'down'
    icon: 'FileText' | 'Eye' | 'Heart' | 'TrendingUp'
    color: string
    accentHex: string
    comparisonText?: string
    sparklineData?: { value: number }[]
}

export interface ContentEngagementPoint {
    date: string
    impressions: number
    engagements: number
}

export interface TopPost {
    title: string
    impressions: number
    engagements: number
    engagementRate: number
    type: 'text' | 'image' | 'video' | 'article'
}

// ─── Content Mock Data Generators ────────────────────────────────────────────

export const getContentKpis = (range: DateRange): ContentKpiMetric[] => {
    const multipliers: Record<DateRange, number> = { '7d': 1, '30d': 3.6, '90d': 9.5, '1y': 40.0, 'custom': 14.5 }
    const m = multipliers[range]

    return [
        {
            id: 'total-posts',
            label: 'Total Posts',
            value: Math.floor(64 * m),
            change: 11.2,
            trend: 'up',
            icon: 'FileText',
            color: 'text-amber-500',
            accentHex: '#f59e0b',
        },
        {
            id: 'total-impressions',
            label: 'Total Impressions',
            value: Math.floor(45_800 * m),
            change: 18.7,
            trend: 'up',
            icon: 'Eye',
            color: 'text-orange-500',
            accentHex: '#f97316',
        },
        {
            id: 'total-engagements',
            label: 'Total Engagements',
            value: Math.floor(6_320 * m),
            change: 14.3,
            trend: 'up',
            icon: 'Heart',
            color: 'text-yellow-500',
            accentHex: '#eab308',
        },
        {
            id: 'engagement-rate',
            label: 'Engagement Rate',
            value: 13.8,
            change: 2.4,
            trend: 'up',
            icon: 'TrendingUp',
            color: 'text-amber-400',
            accentHex: '#fbbf24',
        },
    ].map(m => ({ ...m, comparisonText: getComparisonText(range), sparklineData: generateSparkline() })) as ContentKpiMetric[]
}

export const getContentEngagement = (range: DateRange): ContentEngagementPoint[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const data: ContentEngagementPoint[] = []

    for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (days - i - 1))
        const baseImpressions = 800 + i * 12
        const wave = Math.sin(i * 0.4) * 200
        const noise = (Math.random() - 0.5) * 150
        const impressions = Math.max(300, Math.floor(baseImpressions + wave + noise))
        const engagementRate = 0.08 + Math.random() * 0.08
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            impressions,
            engagements: Math.floor(impressions * engagementRate),
        })
    }
    return data
}

export const getTopPosts = (): TopPost[] => [
    { title: 'Announcing our Series B funding round...', impressions: 12_450, engagements: 1_820, engagementRate: 14.6, type: 'image' },
    { title: 'Meet our new Head of Engineering!', impressions: 9_800, engagements: 1_540, engagementRate: 15.7, type: 'image' },
    { title: '5 lessons from scaling to 100 employees', impressions: 8_200, engagements: 1_180, engagementRate: 14.4, type: 'article' },
    { title: 'We\'re hiring! Check out our open roles', impressions: 7_650, engagements: 980, engagementRate: 12.8, type: 'text' },
    { title: 'Behind the scenes of our hackathon week', impressions: 6_900, engagements: 1_050, engagementRate: 15.2, type: 'video' },
]

// ─── Activity Heatmap Types ─────────────────────────────────────────────────

export interface ActivityDay {
    date: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
}

// ─── Activity Heatmap Generator ──────────────────────────────────────────────

export const getActivityHeatmap = (): ActivityDay[] => {
    const data: ActivityDay[] = []
    const today = new Date()

    for (let i = 364; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        // Simulate realistic activity patterns
        const dayOfWeek = date.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        let count: number
        if (isWeekend) {
            count = Math.random() < 0.4 ? 0 : Math.floor(Math.random() * 4)
        } else {
            const base = 2 + Math.floor(Math.random() * 10)
            const burst = Math.random() < 0.1 ? Math.floor(Math.random() * 8) : 0
            count = base + burst
        }

        let level: 0 | 1 | 2 | 3 | 4
        if (count === 0) level = 0
        else if (count <= 2) level = 1
        else if (count <= 5) level = 2
        else if (count <= 8) level = 3
        else level = 4

        data.push({
            date: date.toISOString().split('T')[0],
            count,
            level,
        })
    }

    return data
}

// ─── Insights Types ──────────────────────────────────────────────────────────

export interface Insight {
    id: string
    type: 'positive' | 'negative' | 'neutral'
    text: string
}

// ─── Insights Generator ──────────────────────────────────────────────────────

export const getInsights = (): Insight[] => [
    {
        id: 'insight-1',
        type: 'positive',
        text: 'Your recent post about the "Series B funding" had an exceptional engagement rate of 14.6%.',
    },
    {
        id: 'insight-2',
        type: 'neutral',
        text: 'Follower growth remains steady. Weekends show 40% less activity than weekdays.',
    },
    {
        id: 'insight-3',
        type: 'positive',
        text: 'Job applications for "Senior Frontend Engineer" are tracking 25% above your average roles.',
    },
]
