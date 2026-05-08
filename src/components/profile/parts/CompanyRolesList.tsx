import React, { useState, useMemo } from 'react';
import { Building2, ChevronDown, ChevronUp, Eye, EyeOff, Pin } from 'lucide-react';
import { CompanyRole } from '@/types/user';
import { updateMemberRoleSettings } from '@/services/api/organization';
import { toast } from 'sonner';

interface CompanyRolesListProps {
    roles: CompanyRole[];
    isOwnProfile: boolean;
    onRoleClick: (role: CompanyRole) => void;
}

export const CompanyRolesList = React.memo(function CompanyRolesList({ roles, isOwnProfile, onRoleClick }: CompanyRolesListProps) {
    const [expanded, setExpanded] = useState(false);
    // Optimistic UI state could be managed here or by refreshing parent. For simplicity, let's use router.refresh() after update or local state mutation.
    // However, ProfileHeader receives `user` from parent which comes from React Query. We should ideally invalidate 'profile' query.
    // But since ProfileHeader is a child, we'll just mutate locally for immediate feedback? 
    // Or simpler: Just rely on Query invalidation if we had access to queryClient.
    // For now, let's just make the API call and maybe reload to reflect changes? Or better, accept a `onUpdate` callback from parent.
    // Given constraints, I'll implementing basic local mutation for UI responsiveness.

    const filteredRoles = useMemo(() => {
        // Sort roles: Primary > Priority > Name
        const sorted = [...roles].sort((a, b) => {
            if (a.is_primary_display && !b.is_primary_display) return -1;
            if (!a.is_primary_display && b.is_primary_display) return 1;
            return (b.priority || 0) - (a.priority || 0); // Descending priority
        });

        return isOwnProfile
            ? sorted
            : sorted.filter((r: CompanyRole) => r.is_role_visible !== false);
    }, [roles, isOwnProfile]);

    const visibleRoles = expanded ? filteredRoles : [filteredRoles[0]];
    const hasVisibleRoles = filteredRoles.length > 0;

    const handlePin = async (e: React.MouseEvent, role: CompanyRole) => {
        e.stopPropagation();
        try {
            const orgId = role.org_id || role.company_id;
            await updateMemberRoleSettings(orgId!, { is_primary_display: true });
            toast.success("Primary role updated");
            window.location.reload(); // Simple refresh to fetch new sorted data
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    const handleVisibility = async (e: React.MouseEvent, role: CompanyRole) => {
        e.stopPropagation();
        try {
            const newVisibility = !role.is_role_visible;
            const orgId = role.org_id || role.company_id;
            await updateMemberRoleSettings(orgId!, { is_role_visible: newVisibility });
            toast.success(newVisibility ? "Role visible" : "Role hidden");
            window.location.reload();
        } catch (error) {
            toast.error("Failed to update visibility");
        }
    };

    return (
        <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
                {hasVisibleRoles && (
                    <div className="group relative">
                        <button
                            onClick={() => onRoleClick(filteredRoles[0])}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border 
                                ${filteredRoles[0].is_role_visible || isOwnProfile
                                    ? "bg-[#EEF2FF] text-[#6366F1] border-[#E0E7FF]"
                                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}
                                ${!filteredRoles[0].is_role_visible && isOwnProfile ? "opacity-60 dashed border-dashed" : ""}
                            `}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{filteredRoles[0].role} at {filteredRoles[0].name}</span>
                            {filteredRoles[0].is_primary_display && <Pin className="w-3 h-3 fill-current ml-0.5" />}
                            {!filteredRoles[0].is_role_visible && isOwnProfile && <EyeOff className="w-3 h-3 ml-0.5" />}
                        </button>

                        {/* Action Buttons for Owner */}
                        {isOwnProfile && (
                            <div className="absolute -right-1 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background shadow-sm border rounded-full p-0.5 scale-90 z-10">
                                {!filteredRoles[0].is_primary_display && (
                                    <button
                                        onClick={(e) => handlePin(e, filteredRoles[0])}
                                        className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-primary"
                                        title="Set as Primary"
                                    >
                                        <Pin className="w-3 h-3" />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => handleVisibility(e, filteredRoles[0])}
                                    className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
                                    title={filteredRoles[0].is_role_visible ? "Hide Role" : "Show Role"}
                                >
                                    {filteredRoles[0].is_role_visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {filteredRoles.length > 1 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                        title={expanded ? "Show less" : "Show more roles"}
                    >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {expanded && filteredRoles.length > 1 && (
                <div className="flex flex-col gap-2 pl-4 border-l-2 border-muted ml-2 mt-1 animate-in fade-in slide-in-from-top-2">
                    {filteredRoles.slice(1).map((role: CompanyRole, index: number) => (
                        <div key={`${role.org_id || role.company_id}-${index}`} className="group relative w-full sm:w-auto">
                            <button
                                onClick={() => onRoleClick(role)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border max-w-full text-left
                                    ${role.is_role_visible || isOwnProfile
                                        ? "bg-[#EEF2FF] text-[#6366F1] border-[#E0E7FF]"
                                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}
                                    ${!role.is_role_visible && isOwnProfile ? "opacity-60 dashed border-dashed" : ""}
                                `}
                            >
                                <Building2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{role.role} at {role.name}</span>
                                {role.is_primary_display && <Pin className="w-3 h-3 fill-current ml-0.5 shrink-0" />}
                                {!role.is_role_visible && isOwnProfile && <EyeOff className="w-3 h-3 ml-0.5 shrink-0" />}
                            </button>

                            {/* Action Buttons for Owner */}
                            {isOwnProfile && (
                                <div className="absolute -right-1 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background shadow-sm border rounded-full p-0.5 scale-90 z-10">
                                    {!role.is_primary_display && (
                                        <button
                                            onClick={(e) => handlePin(e, role)}
                                            className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-primary"
                                            title="Set as Primary"
                                        >
                                            <Pin className="w-3 h-3" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => handleVisibility(e, role)}
                                        className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
                                        title={role.is_role_visible ? "Hide Role" : "Show Role"}
                                    >
                                        {role.is_role_visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
