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

export const sendMessage = async (targetUserId: string, text_content: string, shared_post_id?: string, files?: File[]) => {
  console.log("Sending message with:", { targetUserId, text_content, shared_post_id, files });

  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append("targetUserId", targetUserId);
    if (text_content) formData.append("text_content", text_content);
    if (shared_post_id) formData.append("shared_post_id", shared_post_id);

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
    });
    return response.data;
  }
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
