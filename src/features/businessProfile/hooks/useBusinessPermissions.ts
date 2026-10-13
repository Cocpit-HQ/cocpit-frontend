import React from 'react';

export function useBusinessPermissions(company?: any | null) {
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
  const originalRoleName = name || '';
  const roleName = originalRoleName.toUpperCase();

  // Use role and is_owner flag for accurate ownership detection
  const isOwner = Boolean(company.viewer_role_data?.is_owner) || roleName === 'OWNER' || (permissions.includes('*') && roleName !== 'ADMIN');
  const isAdmin = roleName === 'ADMIN' && !isOwner;

  // Helper to check specific permission
  const checkPermission = (perm: string) => {
    if (isOwner || isAdmin) return true;
    if (!permissions || !Array.isArray(permissions)) return false;
    if (permissions.includes('*')) return true;

    const cleanPerm = String(perm || '').toUpperCase().trim();
    const upperPerms = permissions.map((p: any) => String(p).toUpperCase().trim());

    if (upperPerms.includes('*') || upperPerms.includes(cleanPerm)) return true;

    // CHAT / MESSAGES fallback
    if ((cleanPerm === 'CHAT' || cleanPerm === 'MESSAGES') && (upperPerms.includes('CHAT') || upperPerms.includes('MESSAGES'))) return true;

    // QUERIES fallback
    if (cleanPerm === 'QUERIES' && (upperPerms.includes('QUERIES') || upperPerms.includes('CHAT') || upperPerms.includes('MESSAGES'))) return true;

    // Channel singular/plural fallback
    if ((cleanPerm === 'CHANNELS' || cleanPerm === 'CHANNEL') && (upperPerms.includes('CHANNEL') || upperPerms.includes('CHANNELS'))) return true;

    // Analytics fallback
    if ((cleanPerm === 'VIEW_ANALYTICS' || cleanPerm === 'ANALYTICS') && (upperPerms.includes('ANALYTICS') || upperPerms.includes('VIEW_ANALYTICS'))) return true;

    // JOBS sub-permissions
    if (cleanPerm === 'JOBS_CHAT') {
      return upperPerms.includes("JOBS_CHAT");
    }
    const jobsSubPerms = ["POST_JOBS", "VIEW_APPLICANTS", "JOBS"];
    if (jobsSubPerms.includes(cleanPerm) && upperPerms.includes("JOBS")) return true;

    // TEAMS sub-permissions
    if (cleanPerm === 'ACTIVITY_LOGS') {
      return upperPerms.includes("TEAMS") && upperPerms.includes("ACTIVITY_LOGS");
    }
    const teamsSubPerms = ["VIEW_MEMBERS", "INVITE_MEMBERS", "REMOVE_MEMBERS", "MANAGE_MEMBERS", "MANAGE_ROLES", "TEAMS"];
    if (teamsSubPerms.includes(cleanPerm) && upperPerms.includes("TEAMS")) return true;

    // CHANNEL parent implies channel-related details
    const channelSubPerms = ["MANAGE_COMPANY_DETAILS", "INVITE_MEMBERS", "CHANNEL", "CHANNELS", "MANAGE_CHANNEL"];
    if (channelSubPerms.includes(cleanPerm) && (upperPerms.includes("CHANNEL") || upperPerms.includes("CHANNELS"))) return true;

    // CREATE_POST / CREATE_CONTENT
    if ((cleanPerm === 'CREATE_POST' || cleanPerm === 'CREATE_CONTENT') && (upperPerms.includes('CREATE_POST') || upperPerms.includes('CREATE_CONTENT'))) return true;

    // Hierarchy: MANAGE_X implies VIEW_X
    if (cleanPerm.startsWith("VIEW_") && upperPerms.includes(cleanPerm.replace("VIEW_", "MANAGE_"))) return true;

    return false;
  };

  const isAnalyst = roleName === 'ANALYST';
  const isRecruiter = roleName === 'RECRUITER';
  const isEditor = roleName === 'EDITOR';

  return {
    role: originalRoleName || roleName,
    priority,
    isOwner,
    isAdmin,
    isAnalyst,
    isRecruiter,
    isEditor,
    canEdit: checkPermission('MANAGE_COMPANY_DETAILS'),
    canManageMembers: checkPermission('MANAGE_MEMBERS') || checkPermission('INVITE_MEMBERS') || checkPermission('REMOVE_MEMBERS'),
    canPostJobs: checkPermission('POST_JOBS'),
    canViewJobs: checkPermission('JOBS'),
    canJobsChat: checkPermission('JOBS_CHAT'),
    canChat: checkPermission('CHAT'),
    canCreateContent: checkPermission('CREATE_CONTENT'),
    canViewAnalytics: checkPermission('VIEW_ANALYTICS'),
    canManageRoles: checkPermission('MANAGE_ROLES'),
    canVerify: isOwner,
    canDelete: isOwner,
    checkPermission
  };
}

export const useCompanyPermissions = useBusinessPermissions;
