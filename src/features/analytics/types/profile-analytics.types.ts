// ─────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────
export interface MetricWithTrend {
  value: number | string;
  trend: string; // e.g. "+12%", "-5%", "Stable"
  isPositive: boolean | null;
}

// ─────────────────────────────────────────────
// Overview Tab — GET /api/users/me/analytics/overview
// ─────────────────────────────────────────────
export interface OverviewApiResponse {
  keyMetrics: {
    profileViews: MetricWithTrend;
    searchAppearances: MetricWithTrend;
    connectionRequests: MetricWithTrend;
    followerGrowth: MetricWithTrend;
    opportunityViews: MetricWithTrend;
    resumeViews: MetricWithTrend;
    resumeDownloads: MetricWithTrend;
  };
  chart: {
    labels: string[];
    datasets: { label: string; data: number[] }[];
    startDate: string;
    endDate: string;
    tip: string | null;
  };
  profileStrength: {
    score: number;
    missingFields: string[];
    message: string;
  };
  insights: string[];
}

// ─────────────────────────────────────────────
// Audience Tab — GET /api/users/me/analytics/audience
// ─────────────────────────────────────────────
export interface AudienceApiResponse {
  topMetrics: {
    overallReach: MetricWithTrend;
    profileViews: MetricWithTrend;
    engagementRate: MetricWithTrend;
  };
  audienceLocation: {
    countries: { name: string; value: number }[];
    cities: { name: string; value: number }[];
  };
  audienceIndustries: { name: string; value: number }[];
  insights: string[];
}

// ─────────────────────────────────────────────
// Content Tab — GET /api/users/me/analytics/content
// ─────────────────────────────────────────────
export interface ContentTopPost {
  id: string;
  title: string;
  type: string;
  date: string;
  views: string;
  likes: string;
  shares: string;
  imgSrc: string | null;
  icon: string | null;
}

export interface ContentApiResponse {
  formatPerformance: {
    articlesViews: { value: string; icon: string };
    mediaViews: { value: string; icon: string };
    pollsViews: { value: string; icon: string };
    textViews: { value: string; icon: string };
  };
  topPosts: ContentTopPost[];
}

// ─────────────────────────────────────────────
// Opportunities Tab — GET /api/users/me/analytics/opportunities
// ─────────────────────────────────────────────
export interface OpportunitiesApiResponse {
  topMetrics: {
    opportunityActivity: {
      value: string;
      trend: string;
      label: string;
      isPositive?: boolean | null;
    };
    repeatVisitors: {
      percentage: string;
      count: number;
      label: string;
    };
  };
  topOrganizations: {
    name: string;
    industry: string;
    visits: string;
    role: string;
    icon: string;
  }[];
  organizationIndustries: { name: string; value: number }[];
  insights: string[];
}

// ─────────────────────────────────────────────
// Post Analytics — GET /api/posts/:postId/analytics
// ─────────────────────────────────────────────
export interface PostAnalyticsApiResponse {
  post: {
    title: string;
    type: string;
    publishedAt: string;
    contentSnippet: string;
    mediaUrl: string | null;
    fallbackIcon: string | null;
  };
  performance: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagementRate: string;
  };
  reachChart: {
    labels: string[];
    datasets: { label: string; data: number[] }[];
    dateRangeStr?: {
      start: string;
      end: string;
    };
  };
  directImpact: {
    profileVisits: { value: number; vsAvg: string; isPositive: boolean };
    newFollowers: { value: number; vsAvg: string; isPositive: boolean };
    organizationViews: { value: number; vsAvg: string; isPositive: boolean };
  };
  audienceDemographics: {
    countries: { name: string; value: number }[];
    cities: { name: string; value: number }[];
    industries: { name: string; value: number }[];
  };
}
