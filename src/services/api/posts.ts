import api from "@/lib/axios";

export interface DeletePostResponse {
  message: string;
  deletedPostId: string;
}

export const deletePost = async (postId: string): Promise<DeletePostResponse> => {
  const response = await api.delete<DeletePostResponse>(`/post/${postId}`);
  return response.data;
};
