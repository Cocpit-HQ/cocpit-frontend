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

export const getPostById = async (postId: string, companyId?: string): Promise<BackendPost> => {
  const response = await api.get<BackendPost>(`/post/${postId}`, { params: { companyId } });
  return response.data;
};


export const updatePost = async (postId: string, data: UpdatePostRequest): Promise<BackendPost> => {
  const response = await api.put<BackendPost>(`/post/${postId}`, data);
  return response.data;
};


export const toggleLike = async (postId: string, companyId?: string): Promise<{ postId: string; liked: boolean; likeCount: number }> => {
  const response = await api.post<{ postId: string; liked: boolean; likeCount: number }>(
    `/post/${postId}/like`,
    { companyId }
  );
  return response.data;
};

export const voteInPoll = async (postId: string, optionId: string, companyId?: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/post/${postId}/poll/vote`, { option_id: optionId, companyId });
  return response.data;
};

export const removeVote = async (postId: string, companyId?: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/post/${postId}/poll/vote`, { data: { companyId } });
  return response.data;
};

export const getPollAnalytics = async (postId: string): Promise<any> => {
  const response = await api.get<any>(`/post/${postId}/poll/analytics`);
  return response.data;
};

// Comments
export const addComment = async (postId: string, content: string, parent_id?: string | number | null, companyId?: string) => {
  const response = await api.post(`/post/${postId}/comments`, { content, parent_id: parent_id || null, companyId });
  return response.data;
};

export const updateComment = async (commentId: string, content: string, companyId?: string) => {
  const response = await api.put(`/comments/${commentId}`, { content, companyId });
  return response.data;
};

export const getComments = async (postId: string, companyId?: string) => {
  const response = await api.get(`/post/${postId}/comments`, { params: { companyId } });
  return response.data;
};

export const deleteComment = async (commentId: string, companyId?: string) => {
  const response = await api.delete(`/comments/${commentId}`, { data: { companyId } });
  return response.data;
};

export const toggleCommentLike = async (commentId: string | number, companyId?: string) => {
  const response = await api.post(`/comments/${commentId}/like`, { companyId });
  return response.data;
};

export const toggleCommentPin = async (commentId: string | number, companyId?: string) => {
  const response = await api.post(`/comments/${commentId}/pin`, { companyId });
  return response.data;
};
