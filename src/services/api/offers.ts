import api from "@/lib/axios";

export interface JobOffer {
    offer_id: string;
    job_id: string;
    company_id: string;
    user_id: string;
    sent_by: string;
    message: string | null;
    status: "pending" | "accepted" | "declined" | "withdrawn" | "expired";
    responded_at: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    // From JOIN with jobs
    title: string;
    description: string;
    salary_min: number;
    salary_max: number;
    salary_currency: string;
    salary_period: string;
    job_type: string;
    work_mode: string;
    location: string;
    experience_level: string;
    company_name: string;
    // From JOIN with companies
    company_display_name: string;
    company_logo: string;
    company_slug: string;
    // From JOIN with users
    sent_by_name: string;
    sent_by_avatar?: string;
    // Extra fields for company view
    recipient_name?: string;
    recipient_avatar?: string;
    recipient_headline?: string;
}

/** Get all offers received by the current user */
export const getMyOffers = async (status?: string): Promise<JobOffer[]> => {
    const params = status ? { status } : {};
    const response = await api.get("/jobs/offers/me", { params });
    return response.data;
};

/** Get a single offer's full details */
export const getOfferDetail = async (offerId: string): Promise<JobOffer> => {
    const response = await api.get(`/jobs/offers/${offerId}`);
    return response.data;
};

/** Accept or decline an offer */
export const respondToOffer = async (
    offerId: string,
    action: "accepted" | "declined"
): Promise<{ status: string; message: string }> => {
    const response = await api.patch(`/jobs/offers/${offerId}/respond`, { action });
    return response.data;
};

/** Send a job offer to a user (supports both company and independent recruiters) */
export const sendJobOffer = async (
    companyId: string | null | undefined,
    jobId: string,
    userId: string,
    message?: string
): Promise<{ offer: JobOffer; message: string }> => {
    const endpoint = companyId
        ? `/jobs/companies/${companyId}/offers`
        : `/jobs/offers`;
    const response = await api.post(endpoint, {
        jobId,
        userId,
        message,
    });
    return response.data;
};

/** Company: Get all offers sent by the company */
export const getCompanySentOffers = async (
    companyId: string,
    status?: string
): Promise<JobOffer[]> => {
    const params = status ? { status } : {};
    const response = await api.get(`/jobs/companies/${companyId}/offers/sent`, {
        params,
    });
    return response.data;
};

/** Company: Withdraw a pending offer */
export const withdrawOffer = async (
    companyId: string,
    offerId: string
): Promise<{ status: string; message: string }> => {
    const response = await api.delete(
        `/jobs/companies/${companyId}/offers/${offerId}`
    );
    return response.data;
};

/** Individual offer recipient for a specific job */
export interface OfferRecipient {
    offer_id: string;
    status: string;
    message: string | null;
    created_at: string;
    responded_at: string | null;
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    headline: string | null;
    sent_by_name: string | null;
}

/** Company: Get individual recipients for a specific job's offers */
export const getCompanyOfferRecipients = async (
    companyId: string,
    jobId: string
): Promise<OfferRecipient[]> => {
    const response = await api.get(
        `/jobs/companies/${companyId}/offers/job/${jobId}/recipients`
    );
    return response.data;
};
