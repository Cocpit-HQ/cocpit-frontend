"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGroupChat } from "./groupChat.context";
import { useSocket } from "@/context/SocketContext";
import { useSocial } from "@/context/SocialContext";
import { useToast } from "@/hooks/use-toast";
import { updateGroupDetails, getGroupSharedContent } from "@/services/api/group-chat";
import { createReport } from "@/services/api/report";
import { ReportModal } from "@/components/shared/ReportModal";
import { uploadMedia } from "@/services/api/upload";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import MediaDetailViewer from "../ui/MediaDetailViewer";
import { GroupSharedContent } from "@/types/group-chat";
import {
    GroupProfileHeader,
    GroupTabsNav,
    GroupDetailsTab,
    GroupMembersTab,
    GroupPostsTab,
    GroupMediaTab,
    GroupLinksTab,
    GroupEditView
} from "./details";

interface GroupDetailsProps {
    groupId?: string;
    isOpen: boolean;
    onClose: (targetView: 'chat' | 'info' | 'edit') => void;
    currentUserId: string;
    onAddMember: () => void;
    activeView: 'chat' | 'info' | 'edit';
    setActiveView: (view: 'chat' | 'info' | 'edit') => void;
}

export default function GroupDetails({
    groupId,
    isOpen,
    onClose,
    currentUserId,
    onAddMember,
    activeView,
    setActiveView
}: GroupDetailsProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const {
        activeGroup,
        leaveGroup,
        deleteGroup,
        removeMember,
        promoteToAdmin,
        updateMemberRole,
        isInactive,
        refreshGroup,
        cancelInvitation,
        sentInvitations
    } = useGroupChat();
    const { socket } = useSocket();
    const { blockUser, unblockUser, isBlocked } = useSocial();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    // Tab Navigation State
    const tabFromUrl = searchParams?.get('tab') as GroupDetailsTab;
    const initialTab: GroupDetailsTab = (tabFromUrl && ['members', 'posts', 'media', 'links'].includes(tabFromUrl))
        ? tabFromUrl
        : 'members';
    const [activeTab, setActiveTab] = useState<GroupDetailsTab>(initialTab);

    useEffect(() => {
        const tabParam = searchParams?.get('tab') as GroupDetailsTab;
        if (tabParam && ['members', 'posts', 'media', 'links'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    const handleTabChange = (newTab: GroupDetailsTab) => {
        setActiveTab(newTab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'info');
            url.searchParams.set('tab', newTab);
            window.history.replaceState(null, '', url.pathname + url.search);
        }
    };

    const [isSaving, setIsSaving] = useState(false);
    const [userToShareProfile, setUserToShareProfile] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");

    // Fullscreen Media Viewer State
    const [previewMedia, setPreviewMedia] = useState<{
        url: string;
        type: string;
        name?: string | null;
        mediaList?: Array<{ url: string; type: string; name?: string | null }>;
        initialIndex?: number;
    } | null>(null);

    // Edit Form State
    const [editData, setEditData] = useState({
        name: "",
        headline: "",
        description: "",
        avatar: ""
    });
    const [initialFormState, setInitialFormState] = useState({
        name: "",
        headline: "",
        description: "",
        avatar: ""
    });
    const [formErrors, setFormErrors] = useState({
        name: "",
        headline: ""
    });

    // Confirmation Modal States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [userToRemove, setUserToRemove] = useState<string | null>(null);
    const [userToMakeAdmin, setUserToMakeAdmin] = useState<string | null>(null);
    const [userToDemote, setUserToDemote] = useState<string | null>(null);
    const [reportTarget, setReportTarget] = useState<{
        id: string;
        type: 'USER' | 'COMPANY' | 'GROUP';
        name?: string;
    } | null>(null);
    const [userToBlock, setUserToBlock] = useState<string | null>(null);
    const [invitationToCancel, setInvitationToCancel] = useState<string | null>(null);

    // Shared Content Query (Media, Posts, Links)
    const { data: sharedContent, isLoading: isSharedLoading } = useQuery<GroupSharedContent>({
        queryKey: ['group-shared-content', activeGroup?.conversation_id],
        queryFn: () => getGroupSharedContent(activeGroup!.conversation_id),
        enabled: Boolean(isOpen && activeGroup?.conversation_id),
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false
    });

    // Real-time WebSocket synchronization for shared assets & membership
    useEffect(() => {
        if (!socket || !activeGroup?.conversation_id) return;

        const handleRefreshShared = () => {
            queryClient.invalidateQueries({
                queryKey: ['group-shared-content', activeGroup.conversation_id]
            });
        };

        socket.on("new_message", handleRefreshShared);
        socket.on("message_deleted", handleRefreshShared);
        socket.on("group_updated", handleRefreshShared);
        socket.on("member_joined", handleRefreshShared);
        socket.on("member_removed", handleRefreshShared);

        return () => {
            socket.off("new_message", handleRefreshShared);
            socket.off("message_deleted", handleRefreshShared);
            socket.off("group_updated", handleRefreshShared);
            socket.off("member_joined", handleRefreshShared);
            socket.off("member_removed", handleRefreshShared);
        };
    }, [socket, activeGroup?.conversation_id, queryClient]);

    // Form change detection
    const hasChanges =
        editData.name !== initialFormState.name ||
        editData.headline !== initialFormState.headline ||
        editData.description !== initialFormState.description ||
        editData.avatar !== initialFormState.avatar;

    const validateForm = () => {
        const errors = { name: '', headline: '' };
        let isValid = true;

        if (!editData.name || !editData.name.trim()) {
            errors.name = 'Group name is required';
            isValid = false;
        }

        if (editData.headline && editData.headline.length > 100) {
            errors.headline = 'Headline cannot exceed 100 characters';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    // Synchronize Edit form with active group state
    useEffect(() => {
        if (activeGroup) {
            const currentVals = {
                name: activeGroup.conversation_name || "",
                headline: activeGroup.group_headline || "",
                description: activeGroup.description || "",
                avatar: activeGroup.group_avatar || ""
            };
            setEditData(currentVals);
            setInitialFormState(currentVals);
        }
    }, [activeGroup, activeView]);

    if (!activeGroup) return null;

    const currentMember = activeGroup.members?.find(m => String(m.user_id) === String(currentUserId));
    const isAdmin = Boolean(currentMember?.role === 'admin' && !isInactive);
    const memberCount = activeGroup.members.length;

    // Visible members sorted: current user first, then admins, then alphabetically
    const visibleMembers = activeGroup.members
        .filter(m => !isInactive || String(m.user_id) !== String(currentUserId))
        .sort((a, b) => {
            if (String(a.user_id) === String(currentUserId)) return -1;
            if (String(b.user_id) === String(currentUserId)) return 1;
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (b.role === 'admin' && a.role !== 'admin') return 1;
            return (a.full_name || "").localeCompare(b.full_name || "");
        });

    const handleSave = async () => {
        if (!validateForm() || isSaving) return;
        setIsSaving(true);
        try {
            let avatarUrl: string | undefined = undefined;

            if (editData.avatar === '') {
                avatarUrl = '';
            } else if (editData.avatar.startsWith('https')) {
                avatarUrl = undefined;
            } else if (editData.avatar.startsWith('data:')) {
                const base64Response = await fetch(editData.avatar);
                const blob = await base64Response.blob();
                const file = new File([blob], "group_avatar.jpg", { type: "image/jpeg" });
                const urls = await uploadMedia([file]);
                if (urls && urls.length > 0) {
                    avatarUrl = typeof urls[0] === 'string' ? urls[0] : urls[0].url;
                }
            }

            await updateGroupDetails(activeGroup.conversation_id, {
                name: editData.name.trim(),
                headline: editData.headline.trim(),
                description: editData.description.trim(),
                ...(avatarUrl !== undefined && { avatar: avatarUrl })
            });

            refreshGroup();
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            queryClient.invalidateQueries({ queryKey: ['group-details', activeGroup.conversation_id] });
            toast({ description: "Group details updated successfully" });
            onClose('info');
        } catch (err: any) {
            console.error("Failed to update group details:", err);
            toast({
                title: "Error",
                description: err?.message || "Failed to update group details",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full h-full relative">
            {activeView === 'info' ? (
                <div className="flex flex-col h-full bg-[var(--ds-bg)] text-[var(--ds-text-primary)] font-['DM_Sans'] animate-in slide-in-from-right duration-200">
                    {/* 1. Profile Header with 4 Quick Action Buttons */}
                    <GroupProfileHeader
                        activeGroup={activeGroup}
                        memberCount={memberCount}
                        isAdmin={isAdmin}
                        onBack={() => {
                            if (typeof window !== 'undefined') {
                                const url = new URL(window.location.href);
                                url.searchParams.delete('view');
                                url.searchParams.delete('tab');
                                window.history.replaceState(null, '', url.pathname + url.search);
                            }
                            onClose('chat');
                        }}
                        onEditClick={() => setActiveView('edit')}
                        onAddMember={onAddMember}
                        onSearchClick={() => {
                            if (activeTab !== 'members') {
                                handleTabChange('members');
                                setIsSearchOpen(true);
                            } else {
                                setIsSearchOpen(prev => {
                                    if (prev) {
                                        setMemberSearchQuery("");
                                    }
                                    return !prev;
                                });
                            }
                        }}
                        onBellClick={() => setShowLeaveConfirm(true)}
                        onLeaveClick={() => setShowLeaveConfirm(true)}
                        onDeleteClick={() => setShowDeleteConfirm(true)}
                        onReportClick={() => setReportTarget({
                            id: activeGroup.conversation_id,
                            type: 'GROUP',
                            name: activeGroup.conversation_name
                        })}
                    />

                    {/* 2. 4-Tab Navigation Bar */}
                    <GroupTabsNav
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                    />

                    {/* 3. Active Tab Content Pane */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-8 scrollbar-hide">
                        {activeTab === 'members' && (
                            <GroupMembersTab
                                visibleMembers={visibleMembers}
                                sentInvitations={sentInvitations}
                                isAdmin={isAdmin}
                                currentUserId={currentUserId}
                                isInactive={isInactive}
                                isBlocked={isBlocked}
                                isSearchOpen={isSearchOpen}
                                searchQuery={memberSearchQuery}
                                onSearchQueryChange={setMemberSearchQuery}
                                onCloseSearch={() => {
                                    setIsSearchOpen(false);
                                    setMemberSearchQuery("");
                                }}
                                onMakeAdmin={(userId) => setUserToMakeAdmin(userId)}
                                onDemoteAdmin={(userId) => setUserToDemote(userId)}
                                onShareProfile={(userId) => setUserToShareProfile(userId)}
                                onReportProfile={(userId) => {
                                    const member = activeGroup?.members?.find(m => String(m.user_id) === String(userId));
                                    setReportTarget({
                                        id: userId,
                                        type: member?.org_name ? 'COMPANY' : 'USER',
                                        name: member?.full_name || member?.account_name
                                    });
                                }}
                                onBlockProfile={(userId) => setUserToBlock(userId)}
                                onUnblockProfile={async (userId) => {
                                    try {
                                        await unblockUser(userId);
                                    } catch (err) {}
                                }}
                                onRemoveMember={(userId) => setUserToRemove(userId)}
                                onLeaveGroup={() => setShowLeaveConfirm(true)}
                                onCancelInvitation={(invId) => setInvitationToCancel(invId)}
                            />
                        )}

                        {activeTab === 'posts' && (
                            <GroupPostsTab
                                posts={sharedContent?.posts}
                                isLoading={isSharedLoading}
                                onPostClick={(postId) => {
                                    const targetGroupId = groupId || activeGroup?.conversation_id || '';
                                    const returnTo = `/messaging?groupId=${targetGroupId}&view=info&tab=posts`;
                                    router.push(`/post/${postId}?returnTo=${encodeURIComponent(returnTo)}`);
                                }}
                            />
                        )}

                        {activeTab === 'media' && (
                            <GroupMediaTab
                                media={sharedContent?.media}
                                isLoading={isSharedLoading}
                                onPreviewMedia={(item, idx) => {
                                    setPreviewMedia({
                                        url: item.url,
                                        type: item.media_type,
                                        name: item.filename,
                                        initialIndex: idx,
                                        mediaList: (sharedContent?.media || []).map(m => ({
                                            url: m.url,
                                            type: m.media_type,
                                            name: m.filename
                                        }))
                                    });
                                }}
                            />
                        )}

                        {activeTab === 'links' && (
                            <GroupLinksTab
                                links={sharedContent?.links}
                                isLoading={isSharedLoading}
                            />
                        )}
                    </div>
                </div>
            ) : (
                /* Edit Group Profile Form Screen */
                <GroupEditView
                    editData={editData}
                    setEditData={setEditData}
                    formErrors={formErrors}
                    memberCount={memberCount}
                    hasChanges={hasChanges}
                    isSaving={isSaving}
                    onSave={handleSave}
                    onDiscard={() => setShowDiscardConfirm(true)}
                    onBack={() => onClose('info')}
                />
            )}

            {/* Fullscreen Media Viewer */}
            {previewMedia && (
                <MediaDetailViewer
                    isOpen={Boolean(previewMedia)}
                    onClose={() => setPreviewMedia(null)}
                    items={previewMedia.mediaList || [{ url: previewMedia.url, type: previewMedia.type, name: previewMedia.name }]}
                    initialIndex={previewMedia.initialIndex ?? 0}
                />
            )}

            {/* Modals & Confirm Boxes */}
            {reportTarget && (
                <ReportModal
                    isOpen={reportTarget !== null}
                    onClose={() => setReportTarget(null)}
                    targetType={reportTarget.type}
                    targetId={reportTarget.id}
                    reportedTitle={reportTarget.name}
                    reportedAuthorName={reportTarget.name}
                />
            )}

            <CocpitConfirmBox
                isOpen={userToBlock !== null}
                type="block_profile"
                targetName={activeGroup.members?.find(m => String(m.user_id) === String(userToBlock))?.full_name || "user"}
                onConfirm={async () => {
                    if (!userToBlock) return;
                    try {
                        await blockUser(userToBlock);
                    } catch (err: any) {
                    } finally {
                        setUserToBlock(null);
                    }
                }}
                onCancel={() => setUserToBlock(null)}
            />

            <CocpitConfirmBox
                isOpen={invitationToCancel !== null}
                type="cancel_invitation"
                onConfirm={async () => {
                    if (!invitationToCancel) return;
                    try {
                        await cancelInvitation(invitationToCancel);
                        toast({ description: "Invitation cancelled" });
                    } catch (err: any) {
                        toast({
                            title: "Error",
                            description: err?.message || "Failed to cancel invitation",
                            variant: "destructive"
                        });
                    } finally {
                        setInvitationToCancel(null);
                    }
                }}
                onCancel={() => setInvitationToCancel(null)}
            />

            <CocpitConfirmBox
                isOpen={showDiscardConfirm}
                title="Discard Changes"
                message="You have unsaved changes. Are you sure you want to discard them?"
                confirmText="Discard"
                cancelText="Keep Editing"
                onConfirm={() => {
                    setEditData(initialFormState);
                    setFormErrors({ name: '', headline: '' });
                    setShowDiscardConfirm(false);
                    onClose('info');
                }}
                onCancel={() => setShowDiscardConfirm(false)}
            />

            <CocpitConfirmBox
                isOpen={userToRemove !== null}
                type="remove_member"
                targetName={activeGroup.members?.find(m => String(m.user_id) === String(userToRemove))?.full_name || "this member"}
                onConfirm={async () => {
                    if (!userToRemove) return;
                    try {
                        await removeMember(userToRemove);
                        toast({ description: "Member removed from group" });
                    } catch (err: any) {
                        toast({
                            title: "Error",
                            description: err?.message || "Failed to remove member",
                            variant: "destructive"
                        });
                    } finally {
                        setUserToRemove(null);
                    }
                }}
                onCancel={() => setUserToRemove(null)}
            />

            <CocpitConfirmBox
                isOpen={userToMakeAdmin !== null}
                type="make_admin"
                targetName={activeGroup.members?.find(m => String(m.user_id) === String(userToMakeAdmin))?.full_name || "this member"}
                onConfirm={async () => {
                    if (!userToMakeAdmin) return;
                    try {
                        await promoteToAdmin(userToMakeAdmin);
                        toast({ description: "Member promoted to admin" });
                    } catch (err: any) {
                        toast({
                            title: "Error",
                            description: err?.message || "Failed to promote member",
                            variant: "destructive"
                        });
                    } finally {
                        setUserToMakeAdmin(null);
                    }
                }}
                onCancel={() => setUserToMakeAdmin(null)}
            />

            <CocpitConfirmBox
                isOpen={userToDemote !== null}
                title="Dismiss as Admin"
                message="Are you sure you want to remove admin privileges from this member?"
                confirmText="Dismiss"
                cancelText="Cancel"
                onConfirm={async () => {
                    if (!userToDemote) return;
                    try {
                        await updateMemberRole(userToDemote, 'member');
                        toast({ description: "Admin privileges removed" });
                    } catch (err: any) {
                        toast({
                            title: "Error",
                            description: err?.message || "Failed to update member role",
                            variant: "destructive"
                        });
                    } finally {
                        setUserToDemote(null);
                    }
                }}
                onCancel={() => setUserToDemote(null)}
            />

            <CocpitConfirmBox
                isOpen={showLeaveConfirm}
                type="leave_group"
                onConfirm={async () => {
                    try {
                        await leaveGroup(activeGroup.conversation_id);
                        toast({ description: "You have left the group" });
                        onClose('chat');
                    } catch (err: any) {
                        toast({
                            title: "Error",
                            description: err?.message || "Failed to leave group",
                            variant: "destructive"
                        });
                    } finally {
                        setShowLeaveConfirm(false);
                    }
                }}
                onCancel={() => setShowLeaveConfirm(false)}
            />

            <CocpitConfirmBox
                isOpen={showDeleteConfirm}
                type="delete_group"
                onConfirm={async () => {
                    try {
                        await deleteGroup(activeGroup.conversation_id);
                        toast({ description: "Group deleted successfully" });
                        onClose('chat');
                    } catch (err: any) {
                        toast({
                            title: "Error",
                            description: err?.message || "Failed to delete group",
                            variant: "destructive"
                        });
                    } finally {
                        setShowDeleteConfirm(false);
                    }
                }}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <CocpitShareModel
                isOpen={Boolean(userToShareProfile)}
                onClose={() => setUserToShareProfile(null)}
                profileId={userToShareProfile || undefined}
            />
        </div>
    );
}
