"use client"

import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupDetails, createGroup, inviteMember, leaveGroup, deleteGroup, getGroupInvitations, removeMember } from "../../../services/api/group-chat";
import { GroupDetails, GroupInvitation, CreateGroupPayload } from "../../../types/group-chat";
import { toast } from "sonner";

interface GroupChatContextType {
    activeGroup: GroupDetails | null;
    isLoading: boolean;
    sentInvitations: GroupInvitation[];
    createGroup: (data: CreateGroupPayload) => Promise<void>;
    inviteMember: (receiverId: string) => Promise<void>;
    leaveGroup: (groupId: string) => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
    removeMember: (userId: string) => Promise<void>;
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

    const { data: sentInvitations = [] } = useQuery<GroupInvitation[]>({
        queryKey: ['group-invitations', groupId],
        queryFn: () => groupId ? getGroupInvitations(groupId) : [],
        enabled: !!groupId
    });

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
            leaveGroup: async (gid) => { await leaveMutation.mutateAsync(gid); },
            deleteGroup: async (gid) => { await deleteMutation.mutateAsync(gid); },
            removeMember: async (uid) => {
                const targetGroupId = activeGroup?.conversation_id || groupId;
                if (targetGroupId) {
                    await removeMemberMutation.mutateAsync({ gid: targetGroupId, uid });
                }
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
