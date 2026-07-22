import React from 'react';

export function useCompanyPermissions(company?: any | null) {
    if (!company || !company.viewer_role_data) {
        return {
            isOwner: false,
            isAdmin: false,
            isAnalyst: false,
            isRecruiter: false,
            isEditor: false,
            canEdit: false,
            canManageMembers: false,
            canPostJobs: false,
            canCreateContent: false,
            canViewAnalytics: false,
            canManageRoles: false,
            canVerify: false,
            canDelete: false,
            checkPermission: (perm: string) => false
        };
    }

    const { name, permissions, priority } = company.viewer_role_data;
    const roleName = name.toUpperCase();

    // Use permission-based ownership detection for both companies and institutions
    const isOwner = permissions.includes('*');
    const isAdmin = roleName === 'ADMIN';

    // Helper to check specific permission
    const checkPermission = (perm: string) => {
        if (isOwner || isAdmin) return true;
        if (permissions.includes('*')) return true;
        
        const cleanPerm = perm.toUpperCase().trim();
        
        // Exact match
        if (permissions.includes(cleanPerm)) return true;
        
        // Channel singular/plural fallback
        if (cleanPerm === 'CHANNELS' && permissions.includes('CHANNEL')) return true;
        if (cleanPerm === 'CHANNEL' && permissions.includes('CHANNELS')) return true;
        
        // Analytics fallback
        if (cleanPerm === 'VIEW_ANALYTICS' && permissions.includes('ANALYTICS')) return true;

        // JOBS parent implies sub-permissions
        const jobsSubPerms = ["POST_JOBS", "VIEW_APPLICANTS", "JOBS_CHAT", "JOBS"];
        if (jobsSubPerms.includes(cleanPerm) && permissions.includes("JOBS")) return true;

        // TEAMS parent implies sub-permissions
        const teamsSubPerms = ["VIEW_MEMBERS", "INVITE_MEMBERS", "REMOVE_MEMBERS", "MANAGE_MEMBERS", "MANAGE_ROLES", "ACTIVITY_LOGS", "TEAMS"];
        if (teamsSubPerms.includes(cleanPerm) && permissions.includes("TEAMS")) return true;

        // CHANNEL parent implies channel-related details
        const channelSubPerms = ["MANAGE_COMPANY_DETAILS", "INVITE_MEMBERS", "CHANNEL"];
        if (channelSubPerms.includes(cleanPerm) && permissions.includes("CHANNEL")) return true;
        
        // Sub-permission fallbacks matching the backend
        if (cleanPerm === 'QUERIES' && permissions.includes('CHAT')) return true;
        if (cleanPerm === 'JOBS_CHAT' && permissions.includes('JOBS')) return true;
        
        // Hierarchy: MANAGE_X implies VIEW_X
        if (cleanPerm.startsWith("VIEW_") && permissions.includes(cleanPerm.replace("VIEW_", "MANAGE_"))) return true;
        
        return false;
    };

    const isAnalyst = roleName === 'ANALYST';
    const isRecruiter = roleName === 'RECRUITER';
    const isEditor = roleName === 'EDITOR';

    return {
        role: roleName,
        priority,
        isOwner,
        isAdmin,
        isAnalyst,
        isRecruiter,
        isEditor,
        // Pre-computed common checks for UI convenience
        canEdit: checkPermission('MANAGE_COMPANY_DETAILS'),
        canManageMembers: checkPermission('MANAGE_MEMBERS') || checkPermission('INVITE_MEMBERS') || checkPermission('REMOVE_MEMBERS'),
        canPostJobs: checkPermission('POST_JOBS'),
        canCreateContent: checkPermission('CREATE_CONTENT'),
        canViewAnalytics: checkPermission('VIEW_ANALYTICS'),
        canManageRoles: checkPermission('MANAGE_ROLES'),
        canVerify: isOwner,
        canDelete: isOwner,
        checkPermission
    };
}
