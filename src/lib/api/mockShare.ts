export interface SharePayload {
  postId: string;
  targetUserIds: string[];
  message?: string;
}

/**
 * Mocks the share functionality with a delay to simulate network latency.
 */
export const sharePost = async (payload: SharePayload): Promise<void> => {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      console.log("Mock Share API: Shared successfully", payload);
      resolve();
    }, 1500);
  });
};
