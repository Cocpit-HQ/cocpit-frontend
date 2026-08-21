import api from "@/lib/axios";

// ─────────────────────────────────────────────
// Filter label → backend query param mapper
// UI components must use these exact strings for filter labels.
// ─────────────────────────────────────────────

/** Canonical filter label strings — import and use in UI components to avoid casing drift */
export const ANALYTICS_FILTER_LABELS = {
  LAST_7_DAYS: 'Last 7 Days',
  LAST_30_DAYS: 'Last 30 Days',
  LAST_90_DAYS: 'Last 90 Days',
  ALL_TIME: 'All Time',
  CUSTOM: 'Custom',
} as const;

export function buildAnalyticsParams(
  uiFilter: string,
  dateRange?: { from?: Date; to?: Date }
): Record<string, string> {
  const map: Record<string, string> = {
    "Last 7 Days": "last_7_days",
    "Last 30 Days": "last_30_days",
    "All Time": "all_time",
  };

  if (uiFilter === "Custom" || uiFilter === "Last 90 Days") {
    const params: Record<string, string> = { filter: "custom" };
    if (uiFilter === "Last 90 Days") {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      params.startDate = start.toISOString().split("T")[0];
      params.endDate = end.toISOString().split("T")[0];
    } else if (dateRange?.from && dateRange?.to) {
      params.startDate = dateRange.from.toISOString().split("T")[0];
      params.endDate = dateRange.to.toISOString().split("T")[0];
    }
    return params;
  }

  return { filter: map[uiFilter] ?? "30days" };
}

// ─────────────────────────────────────────────
// Sort option mapper
// ─────────────────────────────────────────────
export function sortOptionToParam(uiSort: string): string {
  const map: Record<string, string> = {
    "Top performing": "top_performing",
    "Most recent": "most_recent",
    "Most viewed": "most_viewed",
    "Most liked": "most_liked",
    "Most shared": "most_shared",
  };
  return map[uiSort] ?? "top_performing";
}

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

export const getAnalyticsOverview = async (
  uiFilter: string,
  dateRange?: { from?: Date; to?: Date }
) => {
  const params = buildAnalyticsParams(uiFilter, dateRange);
  const response = await api.get("/users/me/analytics/overview", { params });
  return response.data.data;
};

export const getAnalyticsAudience = async (
  uiFilter: string,
  dateRange?: { from?: Date; to?: Date }
) => {
  const params = buildAnalyticsParams(uiFilter, dateRange);
  const response = await api.get("/users/me/analytics/audience", { params });
  return response.data.data;
};

export const getAnalyticsContent = async (
  uiFilter: string,
  uiSort: string,
  dateRange?: { from?: Date; to?: Date }
) => {
  const params = {
    ...buildAnalyticsParams(uiFilter, dateRange),
    sort: sortOptionToParam(uiSort),
  };
  const response = await api.get("/users/me/analytics/content", { params });
  return response.data.data;
};

export const getAnalyticsOpportunities = async (
  uiFilter: string,
  dateRange?: { from?: Date; to?: Date }
) => {
  const params = buildAnalyticsParams(uiFilter, dateRange);
  const response = await api.get("/users/me/analytics/opportunities", { params });
  return response.data.data;
};

export const getPostAnalytics = async (
  postId: string,
  uiFilter: string,
  dateRange?: { from?: Date; to?: Date }
) => {
  const params = buildAnalyticsParams(uiFilter, dateRange);
  const response = await api.get(`/posts/${postId}/analytics`, { params });
  return response.data.data;
};

export const recordResumeEvent = async (targetUserId: string, eventType: 'view' | 'download', orgId?: string) => {
  const response = await api.post('/analytics/resume-events', {
    targetUserId,
    eventType,
    orgId
  });
  return response.data;
};
