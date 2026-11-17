import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { searchUsersForMessaging } from "@/services/api/messaging";
import { Check, Loader2, Search } from "lucide-react";
import { CloseIcon, DeleteIcon, PlusIcon, ProfileIcon } from "@/components/icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGroupChat } from "./groupChat.context";
import { useRouter } from "next/navigation";
import { MAX_GROUP_MEMBERS } from "@/constants/messaging";

export type ModalView = 'personalChat' | 'addMembers' | 'createGroup';

export interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: ModalView;
    title?: string;
    mode?: 'create' | 'addMembers';
    groupId?: string;
    excludeUserIds?: string[];
    onAddMembers?: (userIds: string[]) => Promise<void> | void;
}

export default function CreateGroupModal({
    isOpen,
    onClose,
    initialView = 'personalChat',
    title,
    mode = 'create',
    groupId,
    excludeUserIds,
    onAddMembers,
}: CreateGroupModalProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const { createGroup, activeGroup, sentInvitations, inviteMember } = useGroupChat();

    // Navigation & View State
    const [currentView, setCurrentView] = useState<ModalView>(initialView);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentView(initialView);
        }
    }, [isOpen, initialView]);

    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchCursor, setSearchCursor] = useState<string | null>(null);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);

    // Group Creation State
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedUsersData, setSelectedUsersData] = useState<any[]>([]);
    const [groupName, setGroupName] = useState("");
    const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
    const [groupAvatarPreview, setGroupAvatarPreview] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Compute excluded user IDs (self, explicit excludes, active members, pending invitations)
    const excludedIds = useMemo(() => {
        const set = new Set<string>();

        // 1. Current user is always excluded from member selection
        const currentUid = user?.id || (user as any)?.user_id;
        if (currentUid) set.add(String(currentUid));

        // 2. Explicitly passed excluded IDs
        if (excludeUserIds && Array.isArray(excludeUserIds)) {
            excludeUserIds.forEach((id) => {
                if (id) set.add(String(id));
            });
        }

        // 3. If in 'addMembers' mode (or if activeGroup is present), exclude active members & pending invitations
        if (mode === 'addMembers' || activeGroup) {
            // Exclude active members
            if (activeGroup?.members) {
                activeGroup.members.forEach((m: any) => {
                    const mId = m.user_id || m.id;
                    if (mId && !m.left_at) {
                        set.add(String(mId));
                    }
                });
            }

            // Exclude pending invitations
            if (sentInvitations) {
                sentInvitations.forEach((inv: any) => {
                    const invId = inv.invitee_id || inv.user_id;
                    if (invId && (inv.status === 'pending' || !inv.status)) {
                        set.add(String(invId));
                    }
                });
            }
        }

        return set;
    }, [user, excludeUserIds, mode, activeGroup, sentInvitations]);

    // Filter search results against excludedIds
    const filteredResults = useMemo(() => {
        return searchResults.filter((u) => {
            const uid = String(u.user_id || u.id);
            return !excludedIds.has(uid);
        });
    }, [searchResults, excludedIds]);

    // Personal chat excludes current logged-in user
    const personalChatResults = useMemo(() => {
        const currentUid = String(user?.id || (user as any)?.user_id || "");
        return searchResults.filter((u) => {
            const uid = String(u.user_id || u.id);
            return uid !== currentUid;
        });
    }, [searchResults, user]);

    // Available slots calculation
    const currentMemberCount = activeGroup?.members?.filter((m: any) => !m.left_at)?.length || 0;
    const availableSlots = Math.max(0, MAX_GROUP_MEMBERS - currentMemberCount);

    // Update selectedUsersData when selections change
    useEffect(() => {
        const currentResultsSelected = searchResults.filter((u) =>
            selectedUserIds.includes(u.user_id || u.id),
        );
        setSelectedUsersData((prev) => {
            const filtered = prev.filter((u) =>
                selectedUserIds.includes(u.user_id || u.id),
            );
            const newOnes = currentResultsSelected.filter(
                (u) =>
                    !filtered.some((f) => (f.user_id || f.id) === (u.user_id || u.id)),
            );
            return [...filtered, ...newOnes];
        });
    }, [selectedUserIds, searchResults]);

    const runSearch = useCallback(
        async (query: string, cursor?: string, append = false) => {
            setIsSearching(true);
            try {
                const result = await searchUsersForMessaging(
                    query || undefined,
                    cursor,
                    20,
                );
                setSearchResults((prev) => {
                    const combined = append ? [...prev, ...result.data] : result.data;
                    const unique = Array.from(
                        new Map(combined.map((u) => [u.user_id || u.id, u])).values(),
                    );
                    return unique;
                });
                setSearchCursor(result.nextCursor);
                setHasMoreUsers(result.hasMore);
            } catch (err: any) {
                const msg = err?.response?.data?.message || err?.message || "Failed to search users";
                toast({ title: "Error", description: msg, variant: "destructive" });
            } finally {
                setIsSearching(false);
            }
        },
        [toast],
    );

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!isOpen) return;
        debounceRef.current = setTimeout(() => {
            setSearchResults([]);
            setSearchCursor(null);
            setHasMoreUsers(false);
            runSearch(searchTerm);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchTerm, isOpen, runSearch]);

    const handleLoadMore = useCallback(() => {
        if (!hasMoreUsers || isSearching) return;
        runSearch(searchTerm, searchCursor ?? undefined, true);
    }, [hasMoreUsers, isSearching, searchTerm, searchCursor, runSearch]);

    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const el = e.currentTarget;
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
            if (nearBottom) handleLoadMore();
        },
        [handleLoadMore],
    );

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds((prev) => {
            if (prev.includes(userId)) {
                return prev.filter((id) => id !== userId);
            }
            if (mode === 'addMembers') {
                if (availableSlots <= 0) {
                    toast({
                        title: "Group is full",
                        description: `Group has reached the maximum limit of ${MAX_GROUP_MEMBERS} members.`,
                        variant: "destructive"
                    });
                    return prev;
                }
                if (prev.length >= availableSlots) {
                    toast({
                        title: "Limit reached",
                        description: `You can only add up to ${availableSlots} more member${availableSlots === 1 ? "" : "s"}.`,
                        variant: "destructive"
                    });
                    return prev;
                }
            } else {
                if (prev.length >= MAX_GROUP_MEMBERS - 1) {
                    toast({
                        title: "Limit reached",
                        description: `A group can have a maximum of ${MAX_GROUP_MEMBERS} members (including you).`,
                        variant: "destructive"
                    });
                    return prev;
                }
            }
            return [...prev, userId];
        });
    };

    const handleAddClick = async () => {
        if (selectedUserIds.length === 0 || isSubmitting) return;

        if (mode === 'addMembers') {
            setIsSubmitting(true);
            try {
                if (onAddMembers) {
                    await onAddMembers(selectedUserIds);
                } else {
                    for (const uid of selectedUserIds) {
                        await inviteMember(uid);
                    }
                }
                handleClose();
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error?.response?.data?.message || error?.message || "Failed to add members",
                    variant: "destructive",
                });
            } finally {
                setIsSubmitting(false);
            }
        } else {
            setCurrentView('createGroup');
        }
    };

    const handlePersonalChatSelect = (user: any) => {
        const userId = user.user_id || user.id;
        router.push(`/messaging?userId=${userId}`);
        handleClose();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setGroupAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setGroupAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim()) return;
        setIsCreating(true);
        try {
            await createGroup({
                name: groupName,
                description: "",
                members: selectedUserIds,
                avatar: groupAvatar,
            });
            handleClose();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create group",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        setCurrentView(initialView);
        setSearchTerm("");
        setSelectedUserIds([]);
        setSelectedUsersData([]);
        setGroupName("");
        setGroupAvatar(null);
        setGroupAvatarPreview(null);
        setIsSubmitting(false);
        onClose();
    };

    // Modal height per view:
    // View 1 (Personal Chat): 392px
    // View 2 (Add Members): 440px
    // View 3 (Create Group): 454px
    const modalHeightClass =
        currentView === 'personalChat'
            ? 'h-[392px]'
            : currentView === 'addMembers'
            ? 'h-[440px]'
            : 'h-[454px]';

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className={`
                    shadow-none outline-none p-3 !gap-3 [&>button]:hidden
                    fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]
                    w-[calc(100vw-32px)] sm:w-[400px] sm:min-w-[400px] sm:max-w-[400px] ${modalHeightClass}
                    rounded-[16px] border border-[var(--ds-border)]
                    bg-[var(--ds-bg)] text-[var(--ds-text-primary)]
                    font-['DM_Sans'] flex flex-col items-center justify-start overflow-hidden
                    data-[state=open]:animate-in data-[state=open]:fade-in-90 data-[state=open]:zoom-in-95
                `}
            >
                {/* Header (Frame 2609688: 376px x 56px, gap: 12px) */}
                <div className="w-full max-w-[376px] h-[56px] flex flex-col items-center p-0 gap-3 shrink-0">
                    {/* Top Row: Close button (Frame 2609536: 376px x 20px) */}
                    <div className="w-full max-w-[376px] h-5 flex flex-row justify-end items-center p-0 gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer p-0 bg-transparent border-none outline-none"
                            aria-label="Close"
                            title="Close"
                        >
                            <CloseIcon className="w-5 h-5 text-[var(--ds-text-primary)]" size={20} fill="currentColor" />
                        </button>
                    </div>

                    {/* Centered Title */}
                    <DialogTitle className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center text-[var(--ds-text-primary)] p-0 m-0 min-w-[100px] h-[24px] flex items-center justify-center">
                        {title || (currentView === 'personalChat' ? 'Personal Chat' : 'Create group')}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {currentView === 'personalChat'
                            ? 'Search and start a personal 1-on-1 chat.'
                            : currentView === 'addMembers'
                            ? 'Select members to add to the group.'
                            : 'Enter group name, photo, and review members.'}
                    </DialogDescription>
                </div>

                {/* VIEW 1: Personal Chat */}
                {currentView === 'personalChat' && (
                    <div className="w-full max-w-[376px] h-[300px] flex flex-col items-start p-0 gap-2 shrink-0">
                        {/* Search Bar (Component 10: 376px x 36px) */}
                        <div className="w-full max-w-[376px] h-9 py-2 px-0 flex flex-row justify-between items-center gap-1 border-b border-[var(--ds-text-primary)] shrink-0 box-border">
                            <input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none outline-none p-0 font-['DM_Sans'] font-normal text-sm leading-5 text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)]"
                            />
                            <Search className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0" strokeWidth={1.5} />
                        </div>

                        {/* User List (Frame 2609544: 376px x 256px - 6 users visible then hidden scroll) */}
                        <div
                            ref={listRef}
                            onScroll={handleScroll}
                            className="w-full max-w-[376px] h-[256px] flex flex-col items-start p-0 gap-2 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0"
                        >
                            {isSearching && personalChatResults.length === 0 ? (
                                <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-[var(--ds-accent)]" />
                                    <p className="text-xs text-[var(--ds-text-muted)] font-['DM_Sans']">Searching users...</p>
                                </div>
                            ) : personalChatResults.length === 0 ? (
                                <div className="flex flex-col items-center justify-center w-full h-full text-center">
                                    <p className="text-sm text-[var(--ds-text-muted)] font-['DM_Sans']">
                                        {searchTerm.length === 0 ? "Type to search for users" : "No users found"}
                                    </p>
                                </div>
                            ) : (
                                personalChatResults.map((u) => {
                                    const userId = u.user_id || u.id;
                                    const name = u.full_name || u.account_name || u.name || "Cocpit user";
                                    const avatar = u.avatar_url || u.avatar;
                                    return (
                                        <div
                                            key={userId}
                                            onClick={() => handlePersonalChatSelect(u)}
                                            className="w-full max-w-[376px] h-9 flex flex-row justify-between items-center p-0 gap-2 shrink-0 cursor-pointer hover:bg-[var(--ds-surface-1)]/50 rounded-lg transition-colors"
                                        >
                                            <div className="flex flex-row items-center gap-2 h-5">
                                                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] flex items-center justify-center text-[10px] text-[var(--ds-text-primary)]">
                                                    {avatar && avatar !== '/assets/pngegg.png' ? (
                                                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{name.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <span className="font-['DM_Sans'] font-normal text-sm leading-5 text-[var(--ds-text-primary)] truncate">
                                                    {name}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            {isSearching && personalChatResults.length > 0 && (
                                <div className="flex justify-center py-2 w-full">
                                    <Loader2 className="w-4 h-4 animate-spin text-[var(--ds-accent)]" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW 2: Add Members for Group */}
                {currentView === 'addMembers' && (
                    <>
                        {/* Frame 2609544: 376px x 300px, gap: 8px */}
                        <div className="w-full max-w-[376px] h-[300px] flex flex-col items-start p-0 gap-2 shrink-0">
                            {/* Search Bar (Component 10: 376px x 36px) */}
                            <div className="w-full max-w-[376px] h-9 py-2 px-0 flex flex-row justify-between items-center gap-1 border-b border-[var(--ds-text-primary)] shrink-0 box-border">
                                <input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none p-0 font-['DM_Sans'] font-normal text-sm leading-5 text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)]"
                                />
                                <Search className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0" strokeWidth={1.5} />
                            </div>

                            {/* User List with Checkboxes (376px x 256px - 6 users visible) */}
                            <div
                                ref={listRef}
                                onScroll={handleScroll}
                                className="w-full max-w-[376px] h-[256px] flex flex-col items-start p-0 gap-2 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0"
                            >
                                {isSearching && filteredResults.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin text-[var(--ds-accent)]" />
                                        <p className="text-xs text-[var(--ds-text-muted)] font-['DM_Sans']">Searching users...</p>
                                    </div>
                                ) : filteredResults.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center w-full h-full text-center">
                                        <p className="text-sm text-[var(--ds-text-muted)] font-['DM_Sans']">
                                            {searchTerm.length === 0 ? "Type to search for users" : "No users found"}
                                        </p>
                                    </div>
                                ) : (
                                    filteredResults.map((u) => {
                                        const userId = u.user_id || u.id;
                                        const isSelected = selectedUserIds.includes(userId);
                                        const name = u.full_name || u.account_name || u.name || "Cocpit user";
                                        const avatar = u.avatar_url || u.avatar;
                                        return (
                                            <div
                                                key={userId}
                                                onClick={() => toggleUserSelection(userId)}
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ' || e.key === 'Enter') {
                                                        e.preventDefault();
                                                        toggleUserSelection(userId);
                                                    }
                                                }}
                                                role="checkbox"
                                                aria-checked={isSelected}
                                                tabIndex={0}
                                                className="w-full max-w-[376px] h-9 flex flex-row justify-between items-center p-0 gap-2 shrink-0 cursor-pointer hover:bg-[var(--ds-surface-1)]/50 rounded-lg transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)]"
                                            >
                                                <div className="flex flex-row items-center gap-2 h-5">
                                                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] flex items-center justify-center text-[10px] text-[var(--ds-text-primary)]">
                                                        {avatar && avatar !== '/assets/pngegg.png' ? (
                                                            <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span>{name.charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <span className="font-['DM_Sans'] font-normal text-sm leading-5 text-[var(--ds-text-primary)] truncate">
                                                        {name}
                                                    </span>
                                                </div>

                                                {/* Checkbox (20px x 20px, rounded-[4px]) */}
                                                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                                                    {isSelected ? (
                                                        <div className="w-5 h-5 bg-[var(--ds-accent)] rounded-[4px] flex items-center justify-center shrink-0">
                                                            <svg
                                                                width="12"
                                                                height="9"
                                                                viewBox="0 0 12 9"
                                                                fill="none"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="shrink-0"
                                                                aria-hidden="true"
                                                            >
                                                                <path
                                                                    d="M1 4.5L4.5 8L11 1.5"
                                                                    stroke="var(--ds-bg)"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-[4px] shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                {isSearching && filteredResults.length > 0 && (
                                    <div className="flex justify-center py-2 w-full">
                                        <Loader2 className="w-4 h-4 animate-spin text-[var(--ds-accent)]" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Buttons (Frame 2609476: 376px x 36px, gap: 8px) */}
                        <div className="w-full max-w-[376px] h-9 flex flex-row justify-center items-start p-0 gap-2 shrink-0">
                            {/* Primary emphasis button */}
                            <button
                                type="button"
                                onClick={handleAddClick}
                                disabled={selectedUserIds.length === 0 || isSubmitting}
                                className={`w-[77px] h-9 px-3 py-1.5 rounded-[100px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] flex items-center justify-center transition-all cursor-pointer ${
                                    selectedUserIds.length > 0 && !isSubmitting
                                        ? 'bg-[var(--ds-accent)] hover:opacity-90 active:scale-95'
                                        : 'bg-[var(--ds-accent)]/50 opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-[var(--ds-text-primary)]" />
                                ) : (
                                    'Add'
                                )}
                            </button>
                            {/* Secondary button */}
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="w-[77px] h-9 px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] bg-transparent font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] flex items-center justify-center hover:bg-[var(--ds-surface-1)] active:scale-95 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}

                {/* VIEW 3: Create Group Form */}
                {currentView === 'createGroup' && (
                    <>
                        {/* Frame 2609544: 376px x 314px, gap: 8px */}
                        <div className="w-full max-w-[376px] h-[314px] flex flex-col items-center p-0 gap-2 shrink-0">
                            {/* Avatar Upload (Frame 2609482: 60px x 84px, gap: 8px) */}
                            <div className="w-[60px] h-[84px] flex flex-col items-center p-0 gap-2 shrink-0">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-[60px] h-[60px] rounded-full bg-[var(--ds-surface-1)] border border-[var(--ds-border)] flex flex-col items-center justify-center gap-[2px] cursor-pointer overflow-hidden shrink-0 hover:opacity-80 transition-opacity"
                                >
                                    {groupAvatarPreview ? (
                                        <img src={groupAvatarPreview} alt="Group Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <ProfileIcon className="w-5 h-5 text-[var(--ds-text-primary)]" size={20} fill="currentColor" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                />
                                <span
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-[59px] h-4 font-['DM_Sans'] font-normal text-xs leading-4 text-center text-[var(--ds-text-secondary)] cursor-pointer hover:text-[var(--ds-text-primary)] transition-colors shrink-0"
                                >
                                    Add photo
                                </span>
                            </div>

                            {/* Group Name Input (Input with label: 376px x 62px) */}
                            <div className="w-full max-w-[376px] h-[62px] py-2 px-0 flex flex-col justify-center items-start gap-[10px] border-b border-[var(--ds-border)] shrink-0 box-border">
                                <label className="w-[71px] h-4 font-['DM_Sans'] font-medium text-xs leading-4 text-[var(--ds-text-secondary)] text-left">
                                    Group name
                                </label>
                                <input
                                    placeholder="Group name"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none font-['DM_Sans'] font-normal text-base leading-6 text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] p-0"
                                />
                            </div>

                            {/* Members List Header (Frame 2608667: 376px x 20px) */}
                            <div className="w-full max-w-[376px] h-5 flex flex-row justify-between items-center p-0 gap-6 shrink-0">
                                <span className="w-[84px] h-5 font-['DM_Sans'] font-normal text-sm leading-5 text-[var(--ds-text-primary)]">
                                    Members list
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('addMembers')}
                                    className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer p-0 bg-transparent border-none outline-none shrink-0"
                                    title="Add members"
                                    aria-label="Add members"
                                >
                                    <PlusIcon className="w-5 h-5 text-[var(--ds-text-primary)]" size={20} />
                                </button>
                            </div>

                            {/* Selected Members List (Frame: 376px x 124px - show 3 and then scroll hidden) */}
                            <div className="w-full max-w-[376px] h-[124px] max-h-[124px] flex flex-col items-start p-0 gap-2 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
                                {selectedUsersData.map((u) => {
                                    const userId = u.user_id || u.id;
                                    const name = u.full_name || u.account_name || u.name || "Cocpit user";
                                    const avatar = u.avatar_url || u.avatar;
                                    return (
                                        <div
                                            key={userId}
                                            className="w-full max-w-[376px] h-9 flex flex-row justify-between items-center p-0 gap-2 shrink-0"
                                        >
                                            <div className="flex flex-row items-center gap-2 h-5">
                                                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] flex items-center justify-center text-[10px] text-[var(--ds-text-primary)]">
                                                    {avatar && avatar !== '/assets/pngegg.png' ? (
                                                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{name.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <span className="font-['DM_Sans'] font-normal text-sm leading-5 text-[var(--ds-text-primary)] truncate">
                                                    {name}
                                                </span>
                                            </div>

                                            {/* Delete Icon (20px x 20px) */}
                                            <button
                                                type="button"
                                                onClick={() => toggleUserSelection(userId)}
                                                className="w-5 h-5 flex items-center justify-center text-[var(--ds-error)] hover:opacity-80 transition-opacity cursor-pointer p-0 bg-transparent border-none outline-none shrink-0"
                                                title="Remove member"
                                                aria-label="Remove member"
                                            >
                                                <DeleteIcon className="w-5 h-5 text-[var(--ds-error)]" size={20} fill="currentColor" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Buttons (Frame 2609476: 376px x 36px, gap: 8px) */}
                        <div className="w-full max-w-[376px] h-9 flex flex-row justify-center items-start p-0 gap-2 shrink-0">
                            {/* Primary emphasis button */}
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={!groupName.trim() || isCreating}
                                className={`w-[77px] h-9 px-3 py-1.5 rounded-[100px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] flex items-center justify-center transition-all ${
                                    groupName.trim() && !isCreating
                                        ? 'bg-[var(--ds-accent)] hover:opacity-90 active:scale-95 cursor-pointer'
                                        : 'bg-[var(--ds-accent)]/40 text-[var(--ds-text-primary)]/50 cursor-not-allowed'
                                }`}
                            >
                                {isCreating ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-[var(--ds-text-primary)]" />
                                ) : (
                                    <span className="w-[51px] h-6 flex items-center justify-center">Create</span>
                                )}
                            </button>
                            {/* Secondary button */}
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-[77px] h-9 px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] bg-transparent font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] flex items-center justify-center hover:bg-[var(--ds-surface-1)] active:scale-95 transition-colors cursor-pointer"
                            >
                                <span className="w-[53px] h-6 flex items-center justify-center">Cancel</span>
                            </button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
