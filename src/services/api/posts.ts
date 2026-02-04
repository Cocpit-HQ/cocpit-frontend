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

export const voteInPoll = async (postId: string, optionId: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/post/${postId}/poll/vote`, { option_id: optionId });
  return response.data;
};

export const removeVote = async (postId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/post/${postId}/poll/vote`);
  return response.data;
};

export const getPollAnalytics = async (postId: string): Promise<any> => {
  const response = await api.get<any>(`/post/${postId}/poll/analytics`);
  return response.data;
};

// Comments
export const addComment = async (postId: string, content: string, parent_id?: string | number | null) => {
  const response = await api.post(`/post/${postId}/comments`, { content, parent_id: parent_id || null });
  return response.data;
};

export const updateComment = async (commentId: string, content: string) => {
  const response = await api.put(`/comments/${commentId}`, { content });
  return response.data;
};

export const getComments = async (postId: string) => {
  const response = await api.get(`/post/${postId}/comments`);
  return response.data;
};

export const deleteComment = async (commentId: string) => {
  const response = await api.delete(`/comments/${commentId}`);
  return response.data;
};

export const toggleCommentLike = async (commentId: string | number) => {
  const response = await api.post(`/comments/${commentId}/like`);
  return response.data;
};

export const toggleCommentPin = async (commentId: string | number) => {
  const response = await api.post(`/comments/${commentId}/pin`);
  return response.data;
};
