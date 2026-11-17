"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import SharedAvatar from "@/components/shared/Avatar";
import { MenuIcon, SearchIcon } from "@/components/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverClose
} from "@/components/ui/popover";
import { GroupMember, GroupInvitation } from "@/types/group-chat";

interface GroupMembersTabProps {
    visibleMembers: GroupMember[];
    sentInvitations?: GroupInvitation[];
    isAdmin: boolean;
    currentUserId: string;
    isInactive?: boolean;
    isBlocked: (userId: string) => boolean;
    isSearchOpen?: boolean;
    searchQuery?: string;
    onSearchQueryChange?: (query: string) => void;
    onCloseSearch?: () => void;
    onMakeAdmin: (userId: string) => void;
    onDemoteAdmin: (userId: string) => void;
    onShareProfile: (userId: string) => void;
    onReportProfile: (userId: string) => void;
    onBlockProfile: (userId: string) => void;
    onUnblockProfile: (userId: string) => void;
    onRemoveMember: (userId: string) => void;
    onLeaveGroup: () => void;
    onCancelInvitation: (invitationId: string) => void;
}

export const GroupMembersTab: React.FC<GroupMembersTabProps> = ({
    visibleMembers,
    sentInvitations,
    isAdmin,
    currentUserId,
    isBlocked,
    isSearchOpen,
    searchQuery,
    onSearchQueryChange,
    onCloseSearch,
    onMakeAdmin,
    onDemoteAdmin,
    onShareProfile,
    onReportProfile,
    onBlockProfile,
    onUnblockProfile,
    onRemoveMember,
    onLeaveGroup,
    onCancelInvitation
}) => {
    const router = useRouter();
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        }
    }, [isSearchOpen]);

    const filteredMembers = React.useMemo(() => {
        if (!searchQuery?.trim()) return visibleMembers;
        const q = searchQuery.toLowerCase().trim();
        return visibleMembers.filter((m) =>
            m.full_name?.toLowerCase().includes(q) ||
            m.account_name?.toLowerCase().includes(q) ||
            m.headline?.toLowerCase().includes(q)
        );
    }, [visibleMembers, searchQuery]);

    const filteredInvitations = React.useMemo(() => {
        if (!sentInvitations) return [];
        if (!searchQuery?.trim()) return sentInvitations;
        const q = searchQuery.toLowerCase().trim();
        return sentInvitations.filter((inv) =>
            inv.invitee_name?.toLowerCase().includes(q)
        );
    }, [sentInvitations, searchQuery]);

    return (
        /* Frame 2608673: 16px below tabs, max-w-[618px], gap: 16px */
        <div className="mt-4 flex flex-col gap-4 max-w-[618px] mx-auto w-full font-['DM_Sans'] pb-6">
            {/* Search Box: 618px width, 40px height, padding 6px 12px, gap 10px, border-b 1px solid var(--ds-text-primary) */}
            {isSearchOpen && (
                <div className="flex flex-row items-center px-3 py-1.5 gap-2.5 max-w-[618px] mx-auto w-full h-[40px] border-b border-[var(--ds-text-primary)] box-border shrink-0">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery || ""}
                        onChange={(e) => onSearchQueryChange?.(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                onSearchQueryChange?.("");
                                onCloseSearch?.();
                            }
                        }}
                        placeholder="Search"
                        className="flex-1 bg-transparent border-none outline-none font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] p-0"
                    />
                    <button
                        type="button"
                        aria-label="Search members"
                        onClick={() => {
                            searchInputRef.current?.focus();
                        }}
                        className="w-[20px] h-[20px] shrink-0 flex items-center justify-center p-0 bg-transparent border-none outline-none cursor-pointer text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity"
                    >
                        <SearchIcon size={20} className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" fill="var(--ds-text-primary)" />
                    </button>
                </div>
            )}

            {/* Active Members List */}
            <div className="flex flex-col gap-2 w-full">
                {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => {
                    const isSelf = String(member.user_id) === String(currentUserId);
                    const isBlockedByOther = !isSelf && (Boolean(member.is_blocked_by_other) || isBlocked(member.user_id));
                    const isDeactivated = Boolean(member.is_deactivated);
                    const isDeleted = Boolean(member.is_deleted);
                    const isDeactivatedOrDeleted = isDeactivated || isDeleted || Boolean(member.is_unavailable);
                    const isUnknown = isBlockedByOther || isDeactivatedOrDeleted || member.full_name === "Unknown User" || member.full_name === "Unknown Page";
                    const displayName = isSelf ? "You" : (isUnknown ? (member.org_name ? "Unknown Page" : "Unknown User") : member.full_name);
                    const displayHeadline = isUnknown ? "User unavailable" : (member.headline || "Member");
                    const isCompany = Boolean(member.org_name);

                    return (
                        /* Frame 2608668: 52px height, padding: 8px 16px, rounded: 24px, space-between */
                        <div
                            key={member.user_id}
                            className="flex flex-row justify-between items-center px-4 py-2 w-full h-[52px] rounded-[24px] hover:bg-[var(--ds-surface-1)]/40 transition-colors"
                        >
                            {/* Left content: Avatar + Text column (Name & Headline + 8px gap + Admin Badge) */}
                            <div
                                className={cn("flex flex-row items-center gap-2 h-[36px] flex-1 min-w-0", !isUnknown && "cursor-pointer")}
                                onClick={() => {
                                    if (isUnknown) return;
                                    const returnTo = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/messaging';
                                    router.push(`/profile/${member.user_id}?returnTo=${encodeURIComponent(returnTo)}`);
                                }}
                            >
                                {/* Rectangle 82: 32px x 32px, rounded-full (100px) */}
                                <div className="w-[32px] h-[32px] rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                                    <SharedAvatar
                                        url={isUnknown ? undefined : member.avatar_url}
                                        name={displayName}
                                        size="sm"
                                        isCompany={isCompany}
                                        isUnknown={isUnknown}
                                        className="w-[32px] h-[32px]"
                                    />
                                </div>

                                {/* Frame 2609904: Text column */}
                                <div className="flex flex-col items-start justify-center min-w-0">
                                    {/* Name: 16px 600 var(--ds-text-primary) */}
                                    <span className="font-['DM_Sans'] font-semibold text-[16px] leading-[24px] text-[var(--ds-text-primary)] truncate">
                                        {displayName}
                                    </span>

                                    {/* Headline row with Admin Badge sitting directly after with 8px gap */}
                                    <div className="flex flex-row items-center gap-2">
                                        <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-text-secondary)] truncate max-w-[200px] sm:max-w-[280px]">
                                            {displayHeadline}
                                        </span>

                                        {/* Admin Badge: 8px gap after headline (Frame 2609906: Dot 9px x 9px + Text Admin 10px var(--ds-accent)) */}
                                        {member.role === 'admin' && (
                                            <div className="flex flex-row items-center gap-[5px] h-[12px] shrink-0">
                                                <span className="w-[9px] h-[9px] rounded-[7px] bg-[var(--ds-accent)] shrink-0" />
                                                <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-accent)]">
                                                    Admin
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right content: 3-dot menu using project's MenuIcon (accessible to all members) */}
                            {isUnknown ? (
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                disabled
                                                aria-label="Member options unavailable"
                                                className="w-5 h-5 flex items-center justify-center cursor-default opacity-40 p-0 outline-none bg-transparent border-none text-[var(--ds-text-muted)]"
                                            >
                                                <MenuIcon size={20} className="w-5 h-5" fill="var(--ds-text-muted)" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="left"
                                            className="bg-[var(--ds-bg)] text-[var(--ds-text-primary)] border border-[var(--ds-border)] text-xs shadow-md z-[100]"
                                        >
                                            <p>{isDeactivated ? "User account is deactivated" : (isDeleted ? "User account is deleted" : "User unavailable")}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            aria-label="Member options"
                                            className="w-5 h-5 flex items-center justify-center p-0 text-[var(--ds-text-primary)] hover:opacity-80 cursor-pointer outline-none bg-transparent border-none transition-opacity shrink-0"
                                        >
                                            <MenuIcon size={20} className="w-5 h-5 text-[var(--ds-text-primary)]" fill="var(--ds-text-primary)" />
                                        </button>
                                    </PopoverTrigger>
                                    {/* Dropdown 2 from Figma: min-w-[113px], p-3, gap-4, bg-[var(--ds-bg)], border var(--ds-border), rounded-8 */}
                                    <PopoverContent
                                        align="end"
                                        sideOffset={6}
                                        className="w-auto min-w-[113px] p-3 flex flex-col items-start gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-[8px] shadow-2xl z-[100] outline-none"
                                    >
                                        {isSelf ? (
                                            <PopoverClose asChild>
                                                <button
                                                    type="button"
                                                    onClick={onLeaveGroup}
                                                    className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-error)] hover:opacity-80 cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-opacity"
                                                >
                                                    Leave group
                                                </button>
                                            </PopoverClose>
                                        ) : (
                                            <>
                                                {isAdmin && (
                                                    <PopoverClose asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (member.role === 'admin') {
                                                                    onDemoteAdmin(member.user_id);
                                                                } else {
                                                                    onMakeAdmin(member.user_id);
                                                                }
                                                            }}
                                                            className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-colors"
                                                        >
                                                            {member.role === 'admin' ? "Dismiss as admin" : "Make admin"}
                                                        </button>
                                                    </PopoverClose>
                                                )}

                                                <PopoverClose asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const returnTo = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/messaging';
                                                            router.push(`/profile/${member.user_id}?returnTo=${encodeURIComponent(returnTo)}`);
                                                        }}
                                                        className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-colors"
                                                    >
                                                        View profile
                                                    </button>
                                                </PopoverClose>

                                                <PopoverClose asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() => onShareProfile(member.user_id)}
                                                        className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-colors"
                                                    >
                                                        Share profile
                                                    </button>
                                                </PopoverClose>

                                                <PopoverClose asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() => onReportProfile(member.user_id)}
                                                        className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-colors"
                                                    >
                                                        Report profile
                                                    </button>
                                                </PopoverClose>

                                                <PopoverClose asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (isBlocked(member.user_id)) {
                                                                onUnblockProfile(member.user_id);
                                                            } else {
                                                                onBlockProfile(member.user_id);
                                                            }
                                                        }}
                                                        className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-colors"
                                                    >
                                                        {isBlocked(member.user_id) ? "Unblock profile" : "Block profile"}
                                                    </button>
                                                </PopoverClose>

                                                {isAdmin && (
                                                    <PopoverClose asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => onRemoveMember(member.user_id)}
                                                            className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-error)] hover:opacity-80 cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-opacity"
                                                        >
                                                            Remove
                                                        </button>
                                                    </PopoverClose>
                                                )}
                                            </>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    );
                })
            ) : null}
            </div>

            {/* Pending Invitations Section (Included in search results and normal list) */}
            {filteredInvitations.length > 0 && (
                <div className="mt-2 flex flex-col gap-2 w-full">
                    {/* Frame 2608667: Title Pending Invitations (14px font-normal, leading 20px, var(--ds-text-primary)) */}
                    <div className="flex flex-row items-center px-4 h-[20px]">
                        <h3 className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)]">
                            Pending Invitations
                        </h3>
                    </div>

                    {filteredInvitations.map((invitation) => (
                        /* Frame 2608668: Dimmed pending member item */
                        <div
                            key={invitation.invitation_id}
                            className="flex flex-row justify-between items-center px-4 py-2 w-full h-[52px] rounded-[24px] hover:bg-[var(--ds-surface-1)]/40 transition-colors"
                        >
                            <div
                                className={cn("flex flex-row items-center gap-2 h-[36px] flex-1 min-w-0", Boolean(invitation.invitee_id) && "cursor-pointer")}
                                onClick={() => {
                                    if (!invitation.invitee_id) return;
                                    const returnTo = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/messaging';
                                    router.push(`/profile/${invitation.invitee_id}?returnTo=${encodeURIComponent(returnTo)}`);
                                }}
                            >
                                {/* Dimmed avatar with overlay */}
                                <div className="w-[32px] h-[32px] rounded-full overflow-hidden shrink-0 bg-[var(--ds-surface-1)] relative flex items-center justify-center">
                                    {invitation.invitee_avatar ? (
                                        <Image
                                            src={invitation.invitee_avatar}
                                            alt={invitation.invitee_name || ""}
                                            width={32}
                                            height={32}
                                            className="object-cover w-full h-full opacity-60"
                                        />
                                    ) : (
                                        <span className="text-xs font-bold text-[var(--ds-text-muted)]">
                                            {(invitation.invitee_name || "U").substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                                </div>

                                <div className="flex flex-col items-start justify-center min-w-0 flex-1">
                                    <span className="font-['DM_Sans'] font-semibold text-[16px] leading-[24px] text-[var(--ds-text-muted)] truncate">
                                        {invitation.invitee_name || "Invited User"}
                                    </span>
                                    <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-text-secondary)] truncate">
                                        Invitation sent
                                    </span>
                                </div>
                            </div>

                            {isAdmin && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            aria-label="Invitation options"
                                            className="w-5 h-5 flex items-center justify-center p-0 text-[var(--ds-text-primary)] hover:opacity-80 cursor-pointer outline-none bg-transparent border-none transition-opacity shrink-0"
                                        >
                                            <MenuIcon size={20} className="w-5 h-5 text-[var(--ds-text-primary)]" fill="var(--ds-text-primary)" />
                                        </button>
                                    </PopoverTrigger>
                                    {/* Dropdown 3 from Figma (Pending Invitations Admin View): min-w-[133px], p-3, gap-4, bg-[var(--ds-bg)], border var(--ds-border), rounded-8 */}
                                    <PopoverContent
                                        align="end"
                                        sideOffset={6}
                                        className="w-auto min-w-[133px] p-3 flex flex-col items-start gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-[8px] shadow-2xl z-[100] outline-none"
                                    >
                                        <PopoverClose asChild>
                                            <button
                                                type="button"
                                                onClick={() => onCancelInvitation(invitation.invitation_id)}
                                                className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-error)] hover:opacity-80 cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-opacity"
                                            >
                                                Cancel invitation
                                            </button>
                                        </PopoverClose>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state when searching or no members & no invitations */}
            {filteredMembers.length === 0 && filteredInvitations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--ds-text-secondary)]">
                    <p className="text-sm font-medium text-[var(--ds-text-primary)]">No members found</p>
                    <p className="text-xs text-[var(--ds-text-muted)] mt-1">
                        {searchQuery ? `No group members match "${searchQuery}"` : "No members in this group"}
                    </p>
                </div>
            )}
        </div>
    );
};
