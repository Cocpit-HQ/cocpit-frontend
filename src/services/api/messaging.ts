import api from "@/lib/axios";
import { BackendChat, BackendMessage } from "@/types/messaging";

export const getConversations = async (params?: { companyId?: string }): Promise<BackendChat[]> => {
  const response = await api.get("/conversations", { params });
  return response.data;
};

export const getMessages = async (conversationId: string, limit: number = 50, before?: string | null, companyId?: string): Promise<BackendMessage[]> => {
  const params: any = { limit };
  if (before) params.before = before;
  if (companyId) params.companyId = companyId;
  const response = await api.get(`/conversations/${conversationId}/messages`, { params });
  return response.data;
};

export const sendMessage = async (targetUserId: string, text_content: string, shared_post_id?: string, files?: File[], authorCompanyId?: string) => {
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append("targetUserId", targetUserId);
    if (text_content) formData.append("text_content", text_content);
    if (shared_post_id) formData.append("shared_post_id", shared_post_id);
    if (authorCompanyId) formData.append("authorCompanyId", authorCompanyId);

    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await api.post("/messages", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } else {
    const response = await api.post("/messages", {
      targetUserId,
      text_content,
      shared_post_id,
      authorCompanyId,
    });
    return response.data;
  }
};

export const markAsRead = async (conversationId: string, companyId?: string) => {
  const response = await api.patch(`/conversations/${conversationId}/read`, companyId ? { companyId } : {});
  return response.data;
};

export const editMessage = async (messageId: string, text_content: string) => {
  const response = await api.patch(`/messages/${messageId}/edit`, { text_content });
  return response.data;
};

export const deleteMessage = async (messageId: string, deleteForEveryone: boolean = false) => {
  const response = await api.delete(`/messages/${messageId}`, {
    data: { deleteForEveryone }
  });
  return response.data;
};

// ============ Company Chat Sessions ============

export interface ChatSession {
  session_id: string;
  handler_user_id: string;
  handler_name_snapshot: string;
  handler_role_name_snapshot?: string;
  status: 'ACTIVE' | 'TIMED_OUT' | 'ENDED' | 'TRANSFERRED';
  started_at: string;
  last_activity_at: string;
  message_count: number;
}

export const getActiveSession = async (conversationId: string, companyId: string): Promise<{ session: ChatSession | null; featureEnabled: boolean }> => {
  const response = await api.get('/company-chat-sessions/active', { params: { conversationId, companyId } });
  return response.data;
};

export const claimSession = async (conversationId: string, companyId: string) => {
  const response = await api.post('/company-chat-sessions/claim', { conversationId, companyId });
  return response.data;
};

export const releaseSession = async (sessionId: string) => {
  const response = await api.post('/company-chat-sessions/release', { sessionId });
  return response.data;
};

export const takeoverSession = async (conversationId: string, companyId: string) => {
  const response = await api.post('/company-chat-sessions/takeover', { conversationId, companyId });
  return response.data;
};
