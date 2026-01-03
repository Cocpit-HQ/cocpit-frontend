import axios from "axios";

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
  // Use a timeout to simulate an API call for now
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Mock Share API: Shared successfully", payload);
      resolve();
    }, 1500);
  });
};
