import api from "@/lib/axios";
import { GroupDetails, CreateGroupPayload } from "../../types/group-chat";

export const createGroup = async (data: CreateGroupPayload) => {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.members) formData.append("members", JSON.stringify(data.members));
    if (data.avatar) formData.append("avatar", data.avatar);

    const response = await api.post("/groups", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const getGroupDetails = async (groupId: string): Promise<GroupDetails> => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
};

export const inviteMember = async (groupId: string, receiverId: string) => {
    const response = await api.post(`/groups/${groupId}/invite`, { groupId, receiverId });
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

export const sendMessage = async (groupId: string, content: string, type: 'text' | 'image' | 'system' = 'text', files?: File[], replyMessageId?: string) => {
    if (files && files.length > 0) {
        const formData = new FormData();
        formData.append("content", content || "");
        formData.append("type", type);
        if (replyMessageId) formData.append("replyMessageId", replyMessageId);

        files.forEach((file) => {
            formData.append("images", file);
        });

        const response = await api.post(`/groups/${groupId}/messages`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    } else {
        const payload: any = { content, type };
        if (replyMessageId) payload.replyMessageId = replyMessageId;
        const response = await api.post(`/groups/${groupId}/messages`, payload);
        return response.data;
    }
};
export const getGroupInvitations = async (groupId: string) => {
    const response = await api.get(`/groups/${groupId}/invitations`);
    return response.data;
};

export const removeMember = async (groupId: string, userId: string) => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
};

export const promoteToAdmin = async (groupId: string, userId: string) => {
    const response = await api.post(`/groups/${groupId}/members/${userId}/promote`);
    return response.data;
};

export const updateMemberRole = async (groupId: string, userId: string, newRole: 'admin' | 'member') => {
    const response = await api.patch(`/groups/${groupId}/role`, { targetUserId: userId, newRole });
    return response.data;
};

export const updateGroupAvatar = async (groupId: string, avatarUrl: string | null) => {
    const response = await api.put(`/groups/${groupId}/avatar`, { avatarUrl });
    return response.data;
};

export const updateGroupDetails = async (
    groupId: string,
    details: {
        name?: string;
        headline?: string;
        description?: string;
        avatar?: string | null;
    }
) => {
    const response = await api.put(`/groups/${groupId}/details`, details);
    return response.data;
};

export const markGroupAsRead = async (groupId: string) => {
    const response = await api.post(`/groups/${groupId}/read`);
    return response.data;
};

export const getMessageReadReceipts = async (groupId: string, messageId: string) => {
    const response = await api.get(`/groups/${groupId}/messages/${messageId}/read`);
    return response.data;
};
