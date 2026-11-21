import { AnalyticsMainTab, ProfileSubTab } from '../store/analytics.store';

/** Canonical filter label strings — use in UI components to avoid casing drift */
export const ANALYTICS_FILTER_LABELS = {
  LAST_7_DAYS: 'Last 7 days',
  LAST_30_DAYS: 'Last 30 days',
  LAST_90_DAYS: 'Last 90 days',
  ALL_TIME: 'All time',
  CUSTOM: 'Custom',
} as const;

export type AnalyticsFilterLabel = typeof ANALYTICS_FILTER_LABELS[keyof typeof ANALYTICS_FILTER_LABELS];

/** Filter dropdown display options */
export const ANALYTICS_FILTER_OPTIONS: readonly AnalyticsFilterLabel[] = [
  ANALYTICS_FILTER_LABELS.LAST_7_DAYS,
  ANALYTICS_FILTER_LABELS.LAST_30_DAYS,
  ANALYTICS_FILTER_LABELS.ALL_TIME,
  ANALYTICS_FILTER_LABELS.CUSTOM,
] as const;

/** Main navigation tabs */
export const ANALYTICS_MAIN_TABS: { id: AnalyticsMainTab; label: string; disabled?: boolean }[] = [
  { id: 'career-trajectory', label: 'Career trajectory', disabled: true },
  { id: 'profile-analytics', label: 'Profile analytics' },
];

/** Profile analytics sub-navigation tabs */
export const PROFILE_SUB_TABS: ProfileSubTab[] = [
  'Overview',
  'Content',
  'Audience',
  'Opportunities',
];

/** Sort options for Content Tab */
export const ANALYTICS_SORT_OPTIONS = [
  'Top performing',
  'Most viewed',
  'Most liked',
  'Most shared',
  'Most recent',
] as const;

export type AnalyticsSortOption = typeof ANALYTICS_SORT_OPTIONS[number];

/** Sort option to API query parameter mapping */
export const ANALYTICS_SORT_API_MAP: Record<AnalyticsSortOption, string> = {
  'Top performing': 'top_performing',
  'Most viewed': 'most_viewed',
  'Most liked': 'most_liked',
  'Most shared': 'most_shared',
  'Most recent': 'most_recent',
};

/** TanStack Query cache stale times */
export const ANALYTICS_QUERY_STALE_TIMES = {
  OVERVIEW: 5 * 60 * 1000,       // 5 mins
  AUDIENCE: 5 * 60 * 1000,       // 5 mins
  CONTENT: 5 * 60 * 1000,        // 5 mins
  OPPORTUNITIES: 5 * 60 * 1000,  // 5 mins
  POST_ANALYTICS: 5 * 60 * 1000, // 5 mins
  TRAJECTORY: 15 * 60 * 1000,    // 15 mins
} as const;
