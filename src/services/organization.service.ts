import api from '@/lib/axios';
import { isAxiosError } from 'axios';

// API_URL is handled in lib/axios


export interface Company {
    company_id: string;
    org_id?: string;
    entity_type: 'COMPANY' | 'INSTITUTION';
    name: string;
    slug: string;
    email?: string;
    industry?: string;
    size?: string;
    website?: string;
    location?: string;
    logo_url?: string;
    cover_url?: string;
    description?: string;
    slogan?: string;
    headline?: string;
    institution_type?: string;
    established_year?: number;
    campus_location?: string;
    verification_status: 'UNVERIFIED' | 'DOMAIN_PENDING' | 'DOMAIN_VERIFIED' | 'REJECTED';
    is_deleted: boolean;
    created_at: string;
    viewer_role_data?: { name: string; permissions: string[]; priority: number; is_owner?: boolean } | null; // Populated by backend if authenticated
    member_count?: number;
    parent_org?: { org_id: string; name: string; slug: string; logo_url?: string; entity_type: string } | null;
    children_count?: number;
    parent_org_id?: string | null;
}

export interface CompanyMember {
    user_id: string;
    full_name: string;
    email: string; // aggregated from user table usually
    role: 'OWNER' | 'ADMIN' | 'EDITOR';
    joined_at: string;
}

export interface OrganizationTechStack {
    stack_id: string;
    name: string;
    category?: string;
}

export interface OrganizationGalleryItem {
    gallery_id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    created_at: string;
}

export interface OrganizationTechStack {
    stack_id: string;
    name: string;
    category?: string;
}

export interface OrganizationGalleryItem {
    gallery_id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    created_at: string;
}

export const companyService = {
    async checkSlug(slug: string): Promise<boolean> {
        const res = await api.get(`/organizations/check-slug`, { params: { slug } });
        return res.data.available;
    },

    async createCompany(data: {
        name: string;
        slug: string;
        entity_type?: 'COMPANY' | 'INSTITUTION';
        industry?: string;
        size?: string;
        website?: string;
        institution_type?: string;
        established_year?: number;
        campus_location?: string;
    }) {
        const res = await api.post('/organizations', data);
        return res.data.organization;
    },

    async getCompany(slug: string): Promise<Company> {
        const res = await api.get(`/organizations/${slug}`);
        if (res.data && res.data.org_id && !res.data.company_id) {
            res.data.company_id = res.data.org_id;
        }
        return res.data;
    },

    async getUserCompanies(): Promise<(Company & { role: string })[]> {
        const res = await api.get('/organizations/mine');
        // Normalize for consistency
        return res.data.map((c: any) => ({
            ...c,
            company_id: c.company_id || c.org_id
        }));
    },

    async getOwnedCompanies(): Promise<(Company & { role: string; is_owner?: boolean })[]> {
        const res = await api.get('/organizations/owned');
        return res.data.map((c: any) => ({
            ...c,
            company_id: c.company_id || c.org_id
        }));
    },

    async getAccountSettings(companyId: string) {
        const res = await api.get(`/organizations/${companyId}/account-settings`);
        return res.data;
    },

    async updateCompany(companyId: string, data: Partial<Company>) {
        const res = await api.put(`/organizations/${companyId}`, data);
        return res.data;
    },

    async inviteMember(companyId: string, email: string, role: string) {
        const res = await api.post(`/organizations/${companyId}/members/invite`, { email, role });
        return res.data;
    },

    async getMembers(companyId: string, params: { page?: number; limit?: number; search?: string; status?: string; exclude_owner?: boolean; exclude_self?: boolean } = {}): Promise<{ data: any[], meta: any }> {
        const res = await api.get(`/organizations/${companyId}/teams/members`, {
            params,
            headers: {
                'x-actor-type': 'ORGANIZATION',
                'x-actor-id': companyId,
            }
        });
        return res.data;
    },

    async removeMember(companyId: string, userId: string) {
        const res = await api.delete(`/organizations/${companyId}/members/${userId}`);
        return res.data;
    },

    async verifyDomain(companyId: string, domain: string, otp?: string) {
        const res = await api.post(`/organizations/${companyId}/verify/domain`, { domain, otp });
        return res.data;
    },

    async transferOwnership(companyId: string, newOwnerId: string) {
        const res = await api.post(`/organizations/${companyId}/transfer-ownership`, { newOwnerId }, {
            headers: {
                'x-actor-type': 'ORGANIZATION',
                'x-actor-id': companyId,
            }
        });
        return res.data;
    },

    async deleteCompany(companyId: string, password?: string) {
        const res = await api.delete(`/organizations/${companyId}`, { data: { password } });
        return res.data;
    },

    async sendDeleteOrgOTP(companyId: string): Promise<{ success: boolean; message: string; email_masked: string; expires_in_seconds: number; cooldown_seconds: number }> {
        const res = await api.post(`/organizations/${companyId}/delete/send-otp`, {}, {
            headers: {
                'x-actor-type': 'ORGANIZATION',
                'x-actor-id': companyId,
            }
        });
        return res.data;
    },

    async validateDeleteCompanyOTP(companyId: string, otp: string) {
        const res = await api.post(`/organizations/${companyId}/delete/validate-otp`, { otp }, {
            headers: {
                'x-actor-type': 'ORGANIZATION',
                'x-actor-id': companyId,
            }
        });
        return res.data;
    },

    async verifyAndDeleteCompany(companyId: string, otp: string) {
        const res = await api.post(`/organizations/${companyId}/delete/verify-otp`, { otp }, {
            headers: {
                'x-actor-type': 'ORGANIZATION',
                'x-actor-id': companyId,
            }
        });
        return res.data;
    },

    async leaveCompany(companyId: string) {
        const res = await api.post(`/organizations/${companyId}/leave`);
        return res.data;
    },

    async followCompany(companyId: string) {
        const res = await api.post(`/organizations/${companyId}/follow`);
        return res.data;
    },

    async unfollowCompany(companyId: string) {
        const res = await api.delete(`/organizations/${companyId}/unfollow`);
        return res.data;
    },

    async getRelationship(companyId: string): Promise<{ isFollowing: boolean; followerCount: number }> {
        const res = await api.get(`/organizations/${companyId}/relationship`);
        return res.data;
    },

    async getCompanyFollowers(companyId: string, search?: string): Promise<{ user_id: string; full_name: string; headline: string | null; avatar_url: string | null }[]> {
        const params = search ? { search } : {};
        const res = await api.get(`/organizations/${companyId}/followers`, { params });
        return res.data;
    },

    async removeCompanyFollower(companyId: string, followerId: string) {
        const res = await api.delete(`/organizations/${companyId}/followers/${followerId}`);
        return res.data;
    },

    // Analytics
    async getAnalyticsOverview(companyId: string) {
        const res = await api.get(`/organizations/${companyId}/analytics/overview`);
        return res.data;
    },

    async getAnalyticsEngagement(companyId: string) {
        const res = await api.get(`/organizations/${companyId}/analytics/engagement`);
        return res.data;
    },

    async getAnalyticsJobs(companyId: string) {
        const res = await api.get(`/organizations/${companyId}/analytics/jobs`);
        return res.data;
    },

    async getAuditLogs(companyId: string, params: { page?: number, limit?: number, action?: string, actorId?: string }) {
        const res = await api.get(`/organizations/${companyId}/audit-logs`, { params });
        return res.data;
    },

    // Chat Audit
    async getChatSessionHistory(companyId: string, params: any) {
        void companyId;
        const res = await api.get(`/organization-chat-sessions/history`, { params });
        return res.data;
    },

    async getSessionMessages(sessionId: string) {
        const res = await api.get(`/organization-chat-sessions/${sessionId}/messages`);
        return res.data;
    },

    // --- Tech Stack ---
    async getTechStack(slug: string): Promise<OrganizationTechStack[]> {
        const res = await api.get(`/organizations/${slug}/tech-stack`);
        return res.data;
    },
    async addTechStack(companyId: string, name: string, category?: string) {
        const res = await api.post(`/organizations/${companyId}/tech-stack`, { name, category });
        return res.data;
    },
    async removeTechStack(companyId: string, stackId: string) {
        const res = await api.delete(`/organizations/${companyId}/tech-stack/${stackId}`);
        return res.data;
    },

    // --- Gallery ---
    async getGallery(slug: string): Promise<OrganizationGalleryItem[]> {
        const res = await api.get(`/organizations/${slug}/gallery`);
        return res.data;
    },
    async addToGallery(companyId: string, url: string, type: 'image' | 'video', caption?: string) {
        const res = await api.post(`/organizations/${companyId}/gallery`, { url, type, caption });
        return res.data;
    },
    async removeFromGallery(companyId: string, galleryId: string) {
        const res = await api.delete(`/organizations/${companyId}/gallery/${galleryId}`);
        return res.data;
    },

    // --- Advocacy ---


    async getOrganizationPosts(companyId: string, pageParam?: any) {
        const params: any = { limit: 10 };
        if (pageParam) {
            params.cursorCreatedAt = pageParam.cursorCreatedAt;
            params.cursorPostId = pageParam.cursorPostId;
        }
        const res = await api.get(`/organizations/${companyId}/posts`, { params });
        return res.data;
    },

    async notifyEmployees(companyId: string, postId: string | number) {
        const res = await api.post(`/organizations/${companyId}/posts/${postId}/notify`);
        return res.data;
    },

    // --- Institution Enrollments ---
    async requestEnrollment(orgId: string, data: { department?: string; batch_year?: number; enrollment_number?: string }) {
        const res = await api.post(`/organizations/${orgId}/enroll`, data);
        return res.data;
    },

    async getPendingEnrollments(orgId: string) {
        const res = await api.get(`/organizations/${orgId}/enrollments/pending`);
        return res.data;
    },

    async reviewEnrollment(orgId: string, enrollmentId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) {
        const res = await api.patch(`/organizations/${orgId}/enrollments/${enrollmentId}`, { status, admin_notes: notes });
        return res.data;
    },

    // --- Connections (Company Level) ---
    async sendConnectionRequest(companyId: string, userId: string, message?: string) {
        const res = await api.post(`/organizations/${companyId}/connect/${userId}`, { message });
        return res.data;
    },

    async handleConnectionRequest(companyId: string, action: 'accepted' | 'rejected') {
        const res = await api.patch(`/organizations/${companyId}/connect/handle`, { status: action });
        return res.data;
    },

    async cancelConnectionRequest(companyId: string, userId: string) {
        const res = await api.delete(`/organizations/${companyId}/connect/${userId}/cancel`);
        return res.data;
    },

    async removeConnection(companyId: string, userId: string) {
        const res = await api.delete(`/organizations/${companyId}/connections/${userId}`);
        return res.data;
    },

    async getConnectionStatus(companyId: string, userId: string): Promise<{ status: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'rejected' | 'blocked' }> {
        const res = await api.get(`/organizations/${companyId}/connection-status/${userId}`);
        return res.data;
    },

    normalizeError(error: any): string {
        if (isAxiosError(error)) {
            const status = error.response?.status;
            const data = error.response?.data as any;

            if (status === 429) {
                return data?.message || "You are sending requests too quickly. Please wait a moment.";
            }
            if (status === 409) { // Conflict
                return "This company URL is already taken. Please choose another.";
            }
            if (status === 403) {
                return data?.message || "You do not have permission to perform this action.";
            }

            return data?.message || error.message || "An unexpected error occurred";
        }
        return (error as Error).message || "An unexpected error occurred";
    },

    async uploadLogo(companyId: string, formData: FormData) {
        const res = await api.post(`/organizations/${companyId}/logo`, formData);
        return res.data;
    },

    async deleteLogo(companyId: string) {
        const res = await api.delete(`/organizations/${companyId}/logo`);
        return res.data;
    },

    async uploadCover(companyId: string, formData: FormData) {
        const res = await api.post(`/organizations/${companyId}/cover`, formData);
        return res.data;
    },

    async deleteCover(companyId: string) {
        const res = await api.delete(`/organizations/${companyId}/cover`);
        return res.data;
    },

    // --- Notification Preferences ---
    async getNotificationPreferences(companyId: string) {
        const res = await api.get(`/organizations/${companyId}/notification-preferences`);
        return res.data;
    },

    async updateNotificationPreferences(companyId: string, prefs: {
        events_enabled?: boolean;
        jobs_enabled?: boolean;
        posts_enabled?: boolean;
        announcements_enabled?: boolean;
    }) {
        const res = await api.put(`/organizations/${companyId}/notification-preferences`, prefs);
        return res.data;
    },

    // --- Hierarchy ---
    async searchOrganizations(query: string): Promise<Company[]> {
        const res = await api.get(`/organizations/search`, { params: { q: query, limit: 10 } });
        return res.data;
    },

    async getOrgChildren(orgId: string): Promise<Company[]> {
        const res = await api.get(`/organizations/${orgId}/children`);
        return res.data?.children || [];
    },

    async sendParentRequest(orgId: string, parentOrgId: string, message?: string) {
        const res = await api.post(`/organizations/${orgId}/parent-request`, { parent_org_id: parentOrgId, message });
        return res.data;
    },

    async getPendingParentRequests(orgId: string) {
        const res = await api.get(`/organizations/${orgId}/parent-requests`);
        return res.data;
    },

    async respondToParentRequest(orgId: string, requestId: string, action: 'ACCEPT' | 'REJECT') {
        const res = await api.patch(`/organizations/${orgId}/parent-requests/${requestId}`, { action });
        return res.data;
    },

    async removeParent(orgId: string) {
        const res = await api.delete(`/organizations/${orgId}/parent`);
        return res.data;
    },

    // --- User Settings Organization Management ---
    async getUserOrganizationsSettings(): Promise<{ owned: any[]; associated: any[] }> {
        const res = await api.get('/user/organizations');
        return res.data;
    },

    async sendReactivateOrgOTP(orgId: string): Promise<{ success: boolean; message: string; email_masked: string; expires_in_seconds: number; cooldown_seconds: number }> {
        const res = await api.post(`/organizations/${orgId}/reactivate/send-otp`);
        return res.data;
    },

    async reactivateOrgWithOTP(orgId: string, otp: string) {
        const res = await api.post(`/organizations/${orgId}/reactivate/verify-otp`, { otp });
        return res.data;
    },

    async sendRecoverOrgOTP(orgId: string): Promise<{ success: boolean; message: string; email_masked: string; expires_in_seconds: number; cooldown_seconds: number }> {
        const res = await api.post(`/organizations/${orgId}/recover/send-otp`);
        return res.data;
    },

    async recoverOrgWithOTP(orgId: string, otp: string) {
        const res = await api.post(`/organizations/${orgId}/recover/verify-otp`, { otp });
        return res.data;
    },

    async leaveOrg(orgId: string) {
        const res = await api.delete(`/organizations/${orgId}/leave`);
        return res.data;
    },

    async switchContext(orgId: string) {
        const res = await api.post(`/organizations/${orgId}/switch-context`);
        return res.data;
    },
};

