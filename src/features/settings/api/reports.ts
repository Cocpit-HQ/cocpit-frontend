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
    postType?: string | null;
    mediaType?: string | null;
    imageUrl?: string | null;
    videoUrl?: string | null;
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

export const DUMMY_ACCOUNT_ACTIONS: ActionListItem[] = [
    {
        id: 'act-1',
        actionType: 'warning',
        label: 'Warning',
        reason: 'Harassment',
        date: 'Oct 24, 2023',
        status: 'Active',
        statusLabel: 'Active',
    },
    {
        id: 'act-2',
        actionType: 'delete',
        label: 'Post removed “Summer internship opening”',
        reason: 'Spam',
        date: 'Oct 24, 2023',
        status: 'Completed',
        statusLabel: 'Completed',
    },
    {
        id: 'act-3',
        actionType: 'block',
        label: 'Temporary account suspension for 7 days',
        reason: 'Hate speech',
        date: 'Oct 24, 2023',
        status: 'Completed',
        statusLabel: 'Completed',
    },
];

export const DUMMY_ACTION_DETAILS: Record<string, ActionDetail> = {
    'act-1': {
        id: 'act-1',
        actionType: 'warning',
        label: 'Warning',
        reason: 'Harassment',
        date: 'Oct 24, 2023',
        status: 'Active',
        statusLabel: 'Active',
        affectedContentType: 'Account',
        affectedContentId: null,
        affectedContentTitle: null,
        moderatorNote: 'Your account received a warning for harassment. Please adhere to community guidelines.',
        durationDays: null,
    },
    'act-2': {
        id: 'act-2',
        actionType: 'delete',
        label: 'Post removed “Summer internship opening”',
        reason: 'Spam',
        date: 'Oct 24, 2023',
        status: 'Completed',
        statusLabel: 'Completed',
        affectedContentType: 'Post',
        affectedContentId: 'post-1',
        affectedContentTitle: 'Summer internship opening',
        moderatorNote: 'Your content violated our Community Guidelines. Please review our policies to avoid future violations.',
        durationDays: null,
    },
    'act-3': {
        id: 'act-3',
        actionType: 'block',
        label: 'Temporary account suspension for 7 days',
        reason: 'Hate speech',
        date: 'Oct 24, 2023',
        status: 'Completed',
        statusLabel: 'Completed',
        affectedContentType: 'Account',
        affectedContentId: null,
        affectedContentTitle: null,
        moderatorNote: 'Your account has been temporarily suspended for 7 days due to repeated policy violations.',
        durationDays: 7,
    },
};

/**
 * GET /api/user/account-actions
 * Returns list of moderation actions taken against the current user
 */
export const getAccountActions = async (): Promise<{ actions: ActionListItem[] }> => {
    try {
        const res = await api.get(`/user/account-actions`);
        return { actions: res.data?.actions || [] };
    } catch {
        return { actions: [] };
    }
};

/**
 * GET /api/user/account-actions/:id
 * Returns a single account action detail
 */
export const getAccountActionById = async (id: string): Promise<ActionDetail> => {
    if (DUMMY_ACTION_DETAILS[id]) {
        return DUMMY_ACTION_DETAILS[id];
    }
    try {
        const res = await api.get(`/user/account-actions/${id}`);
        return res.data;
    } catch {
        return DUMMY_ACTION_DETAILS['act-2'];
    }
};
