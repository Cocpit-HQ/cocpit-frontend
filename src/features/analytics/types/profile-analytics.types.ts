export type AnalyticsDateFilter = 'today' | '7d' | '30d' | 'all';

export interface BaseMetric {
  value: number;
  trend?: number; // percentage change, e.g. +10, -5
}

export interface OverviewMetrics {
  overallReach: BaseMetric;
  profileViews: BaseMetric;
  engagementRate: BaseMetric;
  topCountries: { name: string; count: number }[];
  industryDistribution: { name: string; count: number }[];
  insights: string[];
}

export interface PostPerformance {
  id: string;
  type: 'article' | 'media' | 'poll' | 'text';
  previewText: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  totalReach: number;
  directImpact: {
    profileVisits: number;
    newFollowers: number;
    recruiterViews: number;
  };
  geographicDistribution: { name: string; count: number }[];
  industryDistribution: { name: string; count: number }[];
}

export interface ContentPerformance {
  formatPerformance: {
    articles: BaseMetric;
    media: BaseMetric;
    polls: BaseMetric;
    text: BaseMetric;
  };
  topPosts: PostPerformance[];
}

export interface AudienceLocation {
  name: string;
  count: number;
}

export interface AudienceInsights {
  overallReach: BaseMetric;
  profileViews: BaseMetric;
  engagementRate: BaseMetric;
  topCountries: AudienceLocation[];
  topCities: AudienceLocation[];
  audienceIndustries: { name: string; percentage: number }[];
  insights: string[];
}

export interface TopOrganization {
  id: string;
  name: string;
  visitCount: number;
  relevantActiveRole?: string;
}

export interface OpportunityMetrics {
  opportunityActivity: BaseMetric; // e.g., recruiter views
  repeatOrganizationVisitors: BaseMetric;
  topOrganizations: TopOrganization[];
  organizationIndustries: { name: string; percentage: number }[];
  insights: string[];
}

export interface ProfileAnalyticsSnapshot {
  overview: OverviewMetrics;
  content: ContentPerformance;
  audience: AudienceInsights;
  opportunities: OpportunityMetrics;
}
