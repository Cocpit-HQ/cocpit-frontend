import React, { createContext, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupDetails, createGroup, inviteMember, leaveGroup, deleteGroup, getGroupInvitations, removeMember, promoteToAdmin } from "../../../services/api/group-chat";
import { GroupDetails, GroupInvitation, CreateGroupPayload } from "../../../types/group-chat";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "../../../hooks/use-auth";

interface GroupChatContextType {
    activeGroup: GroupDetails | null;
    isLoading: boolean;
    error: Error | null;
    sentInvitations: GroupInvitation[];
    createGroup: (data: CreateGroupPayload) => Promise<void>;
    inviteMember: (receiverId: string) => Promise<void>;
    respondToInvitation: (payload: { invitationId: string, action: 'accept' | 'reject' }) => Promise<void>;
    leaveGroup: (groupId: string) => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
    removeMember: (userId: string) => Promise<void>;
    promoteToAdmin: (userId: string) => Promise<void>;
    updateGroupAvatar: (file: File) => Promise<void>;
    refreshGroup: () => void;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
            received?: unknown;
        };
    };
}

const GroupChatContext = createContext<GroupChatContextType | undefined>(undefined);

export const GroupChatProvider: React.FC<{ groupId?: string; children: React.ReactNode }> = ({ groupId, children }) => {
    const queryClient = useQueryClient();

    const { data: activeGroup, isLoading, refetch } = useQuery({
        queryKey: ['group-details', groupId],
        queryFn: () => groupId ? getGroupDetails(groupId) : null,
        enabled: !!groupId
    });

    const { user } = useAuth();

    // Derived state for admin check (safely)
    const isAdmin = activeGroup && user && (activeGroup.admin_id === user.id || activeGroup.members?.find(m => m.user_id === user.id)?.role === 'admin');

    const { data: sentInvitations = [] } = useQuery<GroupInvitation[]>({
        queryKey: ['group-invitations', groupId],
        queryFn: () => groupId ? getGroupInvitations(groupId) : [],
        enabled: !!groupId && !!isAdmin, // Only fetch if admin
        retry: false // Don't retry 403s
    });

    const { socket } = useSocket();

    const promoteToAdminMutation = useMutation({
        mutationFn: ({ gid, uid }: { gid: string, uid: string }) => promoteToAdmin(gid, uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group-details', groupId] });
            toast.success("Member promoted to admin!");
        },
        onError: (err: unknown) => {
            const error = err as ApiError;
            toast.error(error.response?.data?.message || "Failed to promote member");
        }
    });

    const promoteToAdminHandler = async (userId: string) => {
        if (!groupId) return;
        await promoteToAdminMutation.mutateAsync({ gid: groupId, uid: userId });
    };

    useEffect(() => {
        if (!socket || !groupId) return;

        const handleGroupUpdate = (updatedGroup: any) => {
            if (updatedGroup.conversation_id === groupId) {
                refetch();
            }
        };

        const handleInvitationUpdate = (payload: any) => {
            if (payload.groupId === groupId) {
                queryClient.invalidateQueries({ queryKey: ['group-invitations', groupId] });
                // If accepted, member list changed, so refetch group details
                if (payload.status === 'accepted') {
                    refetch();
                }
            }
        };

        const handleRoleUpdate = (payload: any) => {
            if (payload.groupId === groupId) {
                refetch(); // Reload members to see new role
            }
        };

        const handleMessagesRead = (payload: any) => {
            if (payload.conversation_id === groupId) {
                // Should we refetch messages? Or just update a local state?
                // Ideally update local state in context, OR invalidate query 'messages'
                // Since we don't hold messages in context, we just invalidate the query
                queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
            }
        };

        socket.on('group_updated', handleGroupUpdate);
        socket.on('invitation_update', handleInvitationUpdate);
        socket.on('group_role_update', handleRoleUpdate);
        socket.on('messages_read', handleMessagesRead);

        socket.on('removed_from_group', (payload: any) => {
            if (payload.groupId === groupId) {
                // Determine behavior? 
                // Refetch to update "members" list (so user sees they are gone)
                refetch();
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
        });

        return () => {
            socket.off('group_updated', handleGroupUpdate);
            socket.off('invitation_update', handleInvitationUpdate);
            socket.off('group_role_update', handleRoleUpdate);
            socket.off('group_role_update', handleRoleUpdate);
            socket.off('messages_read', handleMessagesRead);
            socket.off('removed_from_group');
        };
    }, [socket, groupId, refetch, queryClient]);

    const createGroupMutation = useMutation<unknown, unknown, CreateGroupPayload>({
        mutationFn: createGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            // toast.success("Group created!");
        }
    });

    const inviteMutation = useMutation({
        mutationFn: ({ groupId, receiverId }: { groupId: string, receiverId: string }) => inviteMember(groupId, receiverId),
        onSuccess: () => {
            toast.success("Invitation sent!");
            queryClient.invalidateQueries({ queryKey: ['group-invitations', groupId] });
        },
        onError: (err: unknown) => {
            console.error("Invite failed", err);
            const error = err as ApiError;
            const msg = error.response?.data?.message || "Failed to invite member";
            if (error.response?.data?.received) {
                // console.log("Failed payload:", error.response.data.received);
            }
            toast.error(msg);
        }
    });

    const leaveMutation = useMutation({
        mutationFn: leaveGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['group-details', groupId] }); // Refresh details to show read-only
            // No redirect, stay to show "You left" status
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            window.location.href = '/messaging';
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: ({ gid, uid }: { gid: string, uid: string }) => removeMember(gid, uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group-details', groupId] });
            toast.success("Member removed");
        },
        onError: (err: unknown) => {
            const error = err as ApiError;
            toast.error(error.response?.data?.message || "Failed to remove member");
        }
    });

    return (
        <GroupChatContext.Provider value={{
            activeGroup: activeGroup || null,
            isLoading,
            error: null, // Basic error handling
            sentInvitations,
            createGroup: async (data) => { await createGroupMutation.mutateAsync(data); },
            inviteMember: async (receiverId) => {
                const targetGroupId = activeGroup?.conversation_id || groupId;
                if (targetGroupId) {
                    await inviteMutation.mutateAsync({ groupId: targetGroupId, receiverId });
                } else {
                    toast.error("Process failed: Missing Group ID");
                }
            },
            respondToInvitation: async (payload) => {
                // Implement respond if needed, or if it's only in list
                console.log("respondToInvitation called in context", payload);
            },
            leaveGroup: async (gid) => { await leaveMutation.mutateAsync(gid); },
            deleteGroup: async (gid) => { await deleteMutation.mutateAsync(gid); },
            removeMember: async (uid) => {
                const targetGroupId = activeGroup?.conversation_id || groupId;
                if (targetGroupId) {
                    await removeMemberMutation.mutateAsync({ gid: targetGroupId, uid });
                }
            },
            promoteToAdmin: promoteToAdminHandler,
            updateGroupAvatar: async (file) => {
                // Placeholder - implemented in component
            },
            refreshGroup: refetch
        }}>
            {children}
        </GroupChatContext.Provider>
    );
};

export const useGroupChat = () => {
    const context = useContext(GroupChatContext);
    if (!context) throw new Error("useGroupChat must be used within GroupChatProvider");
    return context;
};
