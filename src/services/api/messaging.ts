import api from "@/lib/axios";
import { BackendChat, BackendMessage } from "@/types/messaging";

export const getConversations = async (): Promise<BackendChat[]> => {
  const response = await api.get("/conversations");
  return response.data;
};

export const getMessages = async (conversationId: string, limit: number = 50, before?: string | null): Promise<BackendMessage[]> => {
  const params: any = { limit };
  if (before) params.before = before;
  const response = await api.get(`/conversations/${conversationId}/messages`, { params });
  return response.data;
};

export const sendMessage = async (targetUserId: string, text_content: string, shared_post_id?: string) => {
  console.log("Sending message with:", { targetUserId, text_content, shared_post_id });
  const response = await api.post("/messages", {
    targetUserId,
    text_content,
    shared_post_id,
  });
  return response.data;
};

export const markAsRead = async (conversationId: string) => {
  const response = await api.patch(`/conversations/${conversationId}/read`);
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
