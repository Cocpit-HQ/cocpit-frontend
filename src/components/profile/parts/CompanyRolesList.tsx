import React, { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, Eye, EyeOff, Pin } from 'lucide-react';
import { CompanyRole } from '@/types/user';
import { updateMemberRoleSettings } from '@/services/api/organization';
import { toast } from 'sonner';

interface CompanyRolesListProps {
    roles: CompanyRole[];
    isOwnProfile: boolean;
    onRoleClick: (role: CompanyRole) => void;
}

export function CompanyRolesList({ roles, isOwnProfile, onRoleClick }: CompanyRolesListProps) {
    const [expanded, setExpanded] = useState(false);
    // Optimistic UI state could be managed here or by refreshing parent. For simplicity, let's use router.refresh() after update or local state mutation.
    // However, ProfileHeader receives `user` from parent which comes from React Query. We should ideally invalidate 'profile' query.
    // But since ProfileHeader is a child, we'll just mutate locally for immediate feedback? 
    // Or simpler: Just rely on Query invalidation if we had access to queryClient.
    // For now, let's just make the API call and maybe reload to reflect changes? Or better, accept a `onUpdate` callback from parent.
    // Given constraints, I'll implementing basic local mutation for UI responsiveness.

    // Sort roles: Primary > Priority > Name
    // But wait, the parent `user` object is immutable props. We should copy it to state if we want optimistic updates?
    // Or just rely on props being refreshed by parent.
    // Let's sort based on props.

    const sortedRoles = [...roles].sort((a, b) => {
        if (a.is_primary_display && !b.is_primary_display) return -1;
        if (!a.is_primary_display && b.is_primary_display) return 1;
        return (b.priority || 0) - (a.priority || 0); // Descending priority
    });

    const visibleRoles = expanded ? sortedRoles : [sortedRoles[0]];
    const hiddenCount = sortedRoles.length - 1;

    const handlePin = async (e: React.MouseEvent, role: CompanyRole) => {
        e.stopPropagation();
        try {
            await updateMemberRoleSettings(role.company_id, { is_primary_display: true });
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
            await updateMemberRoleSettings(role.company_id, { is_role_visible: newVisibility });
            toast.success(newVisibility ? "Role visible" : "Role hidden");
            window.location.reload();
        } catch (error) {
            toast.error("Failed to update visibility");
        }
    };

    return (
        <div className="flex flex-col items-start gap-2">
            <div className="flex flex-wrap items-center gap-2 transition-all">
                {visibleRoles.map((role) => (
                    <div key={role.company_id} className="group relative">
                        <button
                            onClick={() => onRoleClick(role)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border 
                                ${role.is_primary_display
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}
                                ${!role.is_role_visible && isOwnProfile ? "opacity-60 dashed border-dashed" : ""}
                            `}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{role.role} at {role.name}</span>
                            {role.is_primary_display && <Pin className="w-3 h-3 fill-current ml-0.5" />}
                            {!role.is_role_visible && isOwnProfile && <EyeOff className="w-3 h-3 ml-0.5" />}
                        </button>

                        {/* Action Buttons for Owner */}
                        {isOwnProfile && expanded && (
                            <div className="absolute -right-1 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background shadow-sm border rounded-full p-0.5 scale-90">
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

                {sortedRoles.length > 1 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                    >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
}
