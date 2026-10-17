"use client";

import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useOrgBlockPermissions(targetUserId?: string | null) {
    const { activeProfile, isCompany } = useActiveProfile();

    const roleData = activeProfile?.viewer_role_data;
    const roleName = (roleData?.name || '').toUpperCase();
    const isOwner = Boolean(roleData?.is_owner || roleData?.permissions?.includes('*'));
    const isAdmin = roleName === 'ADMIN' || roleName === 'OWNER' || isOwner;
    const canManageBlock = isCompany ? (isOwner || isAdmin) : true;

    // Direct check if targetUserId is the Organization's Owner or Organization ID itself
    const isTargetOwner = Boolean(
        isCompany && targetUserId && (
            (activeProfile as any)?.created_by === targetUserId || 
            activeProfile?.id === targetUserId
        )
    );

    // Query organization team roles to check if targetUserId is assigned an Admin/Owner role
    const { data: isTargetAdminOrOwner = false } = useQuery({
        queryKey: ["org-target-role-check", activeProfile?.id, targetUserId],
        queryFn: async () => {
            if (!isCompany || !activeProfile?.id || !targetUserId || isTargetOwner) return isTargetOwner;
            try {
                const res = await api.get(`/organizations/${activeProfile.id}/teams/roles`);
                const roles = res.data || [];
                for (const role of roles) {
                    const rName = (role.name || '').toUpperCase();
                    const isOwnerOrAdminRole = rName === 'ADMIN' || rName === 'OWNER' || (role.permissions && role.permissions.includes('*'));
                    if (isOwnerOrAdminRole && Array.isArray(role.members)) {
                        const match = role.members.some((m: any) => m.user_id === targetUserId || m.id === targetUserId);
                        if (match) return true;
                    }
                }
                return false;
            } catch (e) {
                return false;
            }
        },
        enabled: Boolean(isCompany && canManageBlock && activeProfile?.id && targetUserId && !isTargetOwner),
    });

    const targetProtected = isTargetOwner || isTargetAdminOrOwner;
    const canBlockTarget = canManageBlock && !targetProtected;

    return {
        isCompany,
        isOwner,
        isAdmin,
        canManageBlock,
        isTargetAdminOrOwner: targetProtected,
        canBlockTarget,
    };
}
