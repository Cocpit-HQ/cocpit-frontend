import api from "@/lib/axios";
import { ANALYTICS_FILTER_LABELS, ANALYTICS_SORT_API_MAP } from "../constants/analytics.constants";

export { ANALYTICS_FILTER_LABELS };

export function buildAnalyticsParams(
  uiFilter: string,
  dateRange?: { from?: Date; to?: Date }
): Record<string, string> {
  const normalized = (uiFilter || "").trim().toLowerCase();

  if (normalized === "custom" || normalized === "last 90 days") {
    const params: Record<string, string> = { filter: "custom" };
    if (normalized === "last 90 days") {
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

  const map: Record<string, string> = {
    "last 7 days": "last_7_days",
    "last 30 days": "last_30_days",
    "all time": "all_time",
  };

  return { filter: map[normalized] ?? "last_30_days" };
}

// ─────────────────────────────────────────────
// Sort option mapper
// ─────────────────────────────────────────────
export function sortOptionToParam(uiSort: string): string {
  return ANALYTICS_SORT_API_MAP[uiSort as keyof typeof ANALYTICS_SORT_API_MAP] ?? "top_performing";
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
