import api from "@/lib/axios";
import { BackendChat, BackendMessage } from "@/types/messaging";

export const getConversations = async (): Promise<BackendChat[]> => {
  const response = await api.get("/conversations");
  return response.data;
};

export const getMessages = async (conversationId: string): Promise<BackendMessage[]> => {
  const response = await api.get(`/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendMessage = async (targetUserId: string, text_content: string) => {
  const response = await api.post("/messages", {
    targetUserId,
    text_content,
  });
  return response.data;
};

export const markAsRead = async (conversationId: string) => {
  const response = await api.patch(`/conversations/${conversationId}/read`);
  return response.data;
};
