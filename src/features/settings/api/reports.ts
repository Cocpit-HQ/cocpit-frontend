import api from "@/lib/axios";

export interface ReviewNote {
    id: string;
    message: string;
    isSystem: boolean;
    createdAt: string;
}

export interface ReportListItem {
    id: number;
    targetType: string;
    targetId: string;
    reportedUsername: string | null;
    type: string;
    date: string;
    reason: string;
    title: string;
    status: string;
    statusLabel: string;
}

export interface ReportDetail extends ReportListItem {
    reviewNotes: ReviewNote[];
}

export interface ActionListItem {
    id: string;
    actionType: string;
    label: string;
    reason: string;
    date: string;
    status: string;
    statusLabel: string;
}

export interface ActionDetail extends ActionListItem {
    affectedContentType:  string | null;
    affectedContentId:    string | null;
    affectedContentTitle: string | null;
    moderatorNote:        string | null;
    durationDays:         number | null;
}

/**
 * GET /api/user/reports
 * Returns paginated list of reports submitted by the current user
 */
export const getUserReports = async (page = 1, limit = 20): Promise<{
    reports: ReportListItem[];
    pagination: { page: number; limit: number; total: number; hasMore: boolean };
}> => {
    const res = await api.get(`/user/reports`, { params: { page, limit } });
    return res.data;
};

/**
 * GET /api/user/reports/:id
 * Returns a single report with its full review notes timeline
 */
export const getUserReportById = async (id: number | string): Promise<ReportDetail> => {
    const res = await api.get(`/user/reports/${id}`);
    return res.data;
};

/**
 * GET /api/user/account-actions
 * Returns list of moderation actions taken against the current user
 */
export const getAccountActions = async (): Promise<{ actions: ActionListItem[] }> => {
    const res = await api.get(`/user/account-actions`);
    return res.data;
};

/**
 * GET /api/user/account-actions/:id
 * Returns a single account action detail
 */
export const getAccountActionById = async (id: string): Promise<ActionDetail> => {
    const res = await api.get(`/user/account-actions/${id}`);
    return res.data;
};
