import api from '@/lib/axios';

export interface CompanyRole {
    role_id: string;
    company_id: string;
    name: string;
    color: string;
    permissions: string[];
    priority: number;
    is_system_role: boolean;
}

export const companyRolesService = {
    async getRoles(companyId: string): Promise<CompanyRole[]> {
        const res = await api.get(`/organizations/${companyId}/roles`);
        return res.data;
    },

    async createRole(companyId: string, data: { name: string; color: string; permissions: string[]; priority: number }) {
        const res = await api.post(`/organizations/${companyId}/roles`, data);
        return res.data;
    },

    async updateRole(companyId: string, roleId: string, data: Partial<CompanyRole>) {
        const res = await api.put(`/organizations/${companyId}/roles/${roleId}`, data);
        return res.data;
    },

    async deleteRole(companyId: string, roleId: string) {
        const res = await api.delete(`/organizations/${companyId}/roles/${roleId}`);
        return res.data;
    },

    async assignRole(companyId: string, userId: string, roleId: string) {
        const res = await api.put(`/organizations/${companyId}/members/${userId}/role`, { roleId });
        return res.data;
    }
};

export const PERMISSIONS_LIST = [
    { id: 'SWITCH_TO_COMPANY', label: 'Switch to Company Profile' },
    { id: 'MANAGE_COMPANY_DETAILS', label: 'Edit Company Details (Name, Logo, Info)' },
    { id: 'MANAGE_SETTINGS', label: 'Manage Settings (Billing, Domain)' },
    { id: 'VIEW_MEMBERS', label: 'View Team Members' },
    { id: 'INVITE_MEMBERS', label: 'Invite New Members' },
    { id: 'REMOVE_MEMBERS', label: 'Remove Members' },
    { id: 'MANAGE_ROLES', label: 'Manage Roles & Permissions' },
    { id: 'POST_JOBS', label: 'Post & Manage Jobs' },
    { id: 'VIEW_APPLICANTS', label: 'View Job Applicants' },
    { id: 'MANAGE_APPLICANTS', label: 'Manage Applicants (Move Stages)' },
    { id: 'CREATE_CONTENT', label: 'Create Posts & Stories' },
    { id: 'MANAGE_COMMENTS', label: 'Moderate Comments' },
    { id: 'VIEW_ANALYTICS', label: 'View Analytics Dashboard' },
    { id: 'MANAGE_COMPANY_CHATS', label: 'Manage Company Chat Sessions' },
    { id: 'VIEW_COMPANY_CHATS', label: 'View Company Chat Sessions' },
    { id: 'MANAGE_CONNECTIONS', label: 'Manage Company Connections' },
];
