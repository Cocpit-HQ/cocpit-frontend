import api from "@/lib/axios";
import { BackendPost } from "./feed";

export interface DeletePostResponse {
  message: string;
  deletedPostId: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  category?: string;
  visibility?: 'public' | 'private';
  media_urls?: string[];
}

export const deletePost = async (postId: string): Promise<DeletePostResponse> => {
  const response = await api.delete<DeletePostResponse>(`/post/${postId}`);
  return response.data;
};

export const getPostById = async (postId: string): Promise<BackendPost> => {
  const response = await api.get<BackendPost>(`/post/${postId}`);
  return response.data;
};


export const updatePost = async (postId: string, data: UpdatePostRequest): Promise<BackendPost> => {
  const response = await api.put<BackendPost>(`/post/${postId}`, data);
  return response.data;
};

export const toggleLike = async (postId: string): Promise<{ postId: string; liked: boolean; likeCount: number }> => {
  const response = await api.post<{ postId: string; liked: boolean; likeCount: number }>(
    `/post/${postId}/like`
  );
  return response.data;
};
