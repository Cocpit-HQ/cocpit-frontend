import api from "@/lib/axios";

export interface SharePayload {
  postId: string;
  targetUserIds: string[];
  message?: string;
}

/**
 * Mocks the share functionality with a delay to simulate network latency.
 * TODO: Replace with real API call when backend is ready.
 */
export const sharePost = async (payload: SharePayload): Promise<void> => {
  await api.post("/social/share", payload);
};
