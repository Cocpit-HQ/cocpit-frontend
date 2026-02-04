import api from "@/lib/axios";
import { GroupDetails, CreateGroupPayload } from "../../types/group-chat";

export const createGroup = async (data: CreateGroupPayload) => {
    const response = await api.post("/groups", data);
    return response.data;
};

export const getGroupDetails = async (groupId: string): Promise<GroupDetails> => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
};

export const inviteMember = async (groupId: string, receiverId: string) => {
    const response = await api.post("/groups/invite", { groupId, receiverId });
    return response.data;
};

export const getPendingInvitations = async () => {
    const response = await api.get("/groups/invitations");
    return response.data;
};

export const respondInvitation = async (invitationId: string, action: 'accept' | 'reject') => {
    const response = await api.post("/groups/invitation/respond", { invitationId, action });
    return response.data;
};

export const leaveGroup = async (groupId: string) => {
    const response = await api.post(`/groups/${groupId}/leave`);
    return response.data;
};

export const deleteGroup = async (groupId: string) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
};

export const sendMessage = async (groupId: string, content: string, type: 'text' | 'image' | 'system' = 'text') => {
    const response = await api.post(`/groups/${groupId}/messages`, { content, type });
    return response.data;
};
export const getGroupInvitations = async (groupId: string) => {
    const response = await api.get(`/groups/${groupId}/invitations`);
    return response.data;
};

export const removeMember = async (groupId: string, userId: string) => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
};

export const updateGroupAvatar = async (groupId: string, avatarUrl: string) => {
    const response = await api.put(`/groups/${groupId}/avatar`, { avatarUrl });
    return response.data;
};
