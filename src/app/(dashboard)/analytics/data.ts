import { TimeRange } from './page'

// --- Interfaces ---

export interface OverviewStat {
  label: string
  value: string | null
  change: string // e.g., "+12.5%"
  trend: 'up' | 'down' | 'neutral'
  iconName: 'Eye' | 'Search' | 'UserPlus' | 'MessageSquare'
}

export interface SkillData {
  skill: string
  currentLevel: number // 0-100
  requiredLevel: number // 0-100
  gap: number // requiredLevel - currentLevel
}

export interface EngagementDataPoint {
  date: string
  views: number
  likes: number
  comments: number
}

export interface FunnelStage {
  stage: string
  count: number
  conversionRate: string // e.g. "45%"
}

export interface AudienceMetric {
  name: string
  value: number
  percentage: number
}

// --- Mock Data Generators ---

export const getOverviewStats = (range: TimeRange): OverviewStat[] => {
  const multipliers: Record<TimeRange, number> = {
    '7d': 1,
    '30d': 3.5,
    '90d': 9,
    'all': 45
  }
  const m = multipliers[range]

  return [
    {
      label: 'Profile Views',
      value: (1240 * m).toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      iconName: 'Eye'
    },
    {
      label: 'Search Appearances',
      value: (450 * m).toLocaleString(),
      change: '+5.2%',
      trend: 'up',
      iconName: 'Search'
    },
    {
      label: 'Connection Requests',
      value: (85 * m).toLocaleString(),
      change: '-2.1%',
      trend: 'down',
      iconName: 'UserPlus'
    },
    {
      label: 'Total Impressions',
      value: (1840 * m).toLocaleString(),
      change: '+18.0%',
      trend: 'up',
      iconName: 'Eye'
    }
  ]
}

export const TARGET_ROLES = [
  { id: 'senior-product-designer', label: 'Senior Product Designer' },
  { id: 'frontend-architect', label: 'Frontend Architect' },
  { id: 'marketing-manager', label: 'Marketing Manager' },
  { id: 'full-stack-engineer', label: 'Full Stack Engineer' }
]

export const getSkillGapData = (roleId: string): SkillData[] => {
  const baseData: Record<string, SkillData[]> = {
    'senior-product-designer': [
      { skill: 'UI Design', currentLevel: 90, requiredLevel: 95, gap: 5 },
      { skill: 'UX Research', currentLevel: 75, requiredLevel: 90, gap: 15 },
      { skill: 'Prototyping', currentLevel: 85, requiredLevel: 85, gap: 0 },
      { skill: 'Design Systems', currentLevel: 60, requiredLevel: 85, gap: 25 },
      { skill: 'Leadership', currentLevel: 50, requiredLevel: 80, gap: 30 },
      { skill: 'Strategy', currentLevel: 65, requiredLevel: 85, gap: 20 },
    ],
    'frontend-architect': [
      { skill: 'React/Next.js', currentLevel: 95, requiredLevel: 95, gap: 0 },
      { skill: 'System Design', currentLevel: 70, requiredLevel: 90, gap: 20 },
      { skill: 'Performance', currentLevel: 75, requiredLevel: 90, gap: 15 },
      { skill: 'Testing', currentLevel: 80, requiredLevel: 85, gap: 5 },
      { skill: 'Cloud/DevOps', currentLevel: 40, requiredLevel: 75, gap: 35 },
      { skill: 'Team Mentoring', currentLevel: 60, requiredLevel: 85, gap: 25 },
    ],
     'marketing-manager': [
      { skill: 'Content Strategy', currentLevel: 80, requiredLevel: 90, gap: 10 },
      { skill: 'SEO/SEM', currentLevel: 60, requiredLevel: 85, gap: 25 },
      { skill: 'Data Analytics', currentLevel: 70, requiredLevel: 80, gap: 10 },
      { skill: 'Campaign Mgmt', currentLevel: 85, requiredLevel: 95, gap: 10 },
      { skill: 'Brand Voice', currentLevel: 90, requiredLevel: 90, gap: 0 },
      { skill: 'Budgeting', currentLevel: 40, requiredLevel: 75, gap: 35 },
    ],
     'full-stack-engineer': [
      { skill: 'Frontend', currentLevel: 90, requiredLevel: 90, gap: 0 },
      { skill: 'Backend (Node)', currentLevel: 75, requiredLevel: 85, gap: 10 },
      { skill: 'Database (SQL)', currentLevel: 65, requiredLevel: 80, gap: 15 },
      { skill: 'API Design', currentLevel: 80, requiredLevel: 90, gap: 10 },
      { skill: 'Deployment', currentLevel: 60, requiredLevel: 75, gap: 15 },
      { skill: 'Security', currentLevel: 50, requiredLevel: 80, gap: 30 },
    ]
  }
  return baseData[roleId] || baseData['senior-product-designer']
}

export const getEngagementData = (range: TimeRange): EngagementDataPoint[] => {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 12; // 12 months for 'all'
  const data: EngagementDataPoint[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));

    // Randomize some data with a slight upward trend
    const baseView = 100 + (i * 2) + Math.random() * 50;

    data.push({
      date: range === 'all'
        ? date.toLocaleString('default', { month: 'short' })
        : date.toLocaleString('default', { month: 'short', day: 'numeric' }),
      views: Math.floor(baseView),
      likes: Math.floor(baseView * 0.15),
      comments: Math.floor(baseView * 0.05)
    });
  }

  // For 'all', we might want to aggregate by month to keep the chart clean,
  // but for simplicity in this mock, we'll just return the generated points.
  // In a real app, 'all' would likely be monthly aggregates.
  return data;
}

export const getFunnelData = (range: TimeRange): FunnelStage[] => {
   const multipliers: Record<TimeRange, number> = {
    '7d': 1,
    '30d': 3.5,
    '90d': 9,
    'all': 45
  }
  const m = multipliers[range]

  return [
    { stage: 'Search Appearances', count: Math.floor(4500 * m), conversionRate: '100%' },
    { stage: 'Profile Clicks', count: Math.floor(1240 * m), conversionRate: '27.5%' },
    { stage: 'Connected/Followed', count: Math.floor(180 * m), conversionRate: '14.5%' },
    { stage: 'Message/Inquiry', count: Math.floor(24 * m), conversionRate: '13.3%' },
  ]
}

export const getAudienceIndustries = (): AudienceMetric[] => [
  { name: 'Technology', value: 450, percentage: 45 },
  { name: 'Design', value: 300, percentage: 30 },
  { name: 'Marketing', value: 150, percentage: 15 },
  { name: 'Finance', value: 100, percentage: 10 },
]

export const getAudienceLocations = (): AudienceMetric[] => [
  { name: 'San Francisco, CA', value: 280, percentage: 35 },
  { name: 'New York, NY', value: 160, percentage: 20 },
  { name: 'London, UK', value: 120, percentage: 15 },
  { name: 'Remote / Other', value: 240, percentage: 30 },
]
