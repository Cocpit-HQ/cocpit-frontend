import api from "@/lib/axios";
import { BackendPost } from "./feed";
import { BackendComment } from "@/lib/mappers/feed.mapper";

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
  location?: string | null;
}

export const deletePost = async (postId: string, companyId?: string): Promise<DeletePostResponse> => {
  const response = await api.delete<DeletePostResponse>(`/post/${postId}`, {
    data: companyId ? { companyId } : undefined,
  });
  return response.data;
};

export const getPostById = async (postId: string, companyId?: string): Promise<BackendPost> => {
  void companyId;
  const response = await api.get<BackendPost>(`/post/${postId}`);
  return response.data;
};


export const updatePost = async (postId: string, data: UpdatePostRequest): Promise<BackendPost> => {
  const response = await api.put<BackendPost>(`/post/${postId}`, data);
  return response.data;
};


export interface LikerInfo {
  userId: string | null;
  username: string | null;
  fullName: string | null;
  avatar: string | null;
}

export interface ToggleLikeResponse {
  postId: string;
  liked: boolean;
  likeCount: number;
  username: string | null;
  liker: LikerInfo;
}

export const toggleLike = async (postId: string, companyId?: string): Promise<ToggleLikeResponse> => {
  const response = await api.post<ToggleLikeResponse>(`/post/${postId}/like`, { companyId });
  return response.data;
};

export interface PostLikerInfo {
  likedAt: string;
  isOrganization: boolean;
  individualUserId: string | null;
  organizationId: string | null;
  userId: string;
  username: string;
  fullName: string;
  avatar: string | null;
}

export interface GetPostLikesResponse {
  postId: string;
  likes: PostLikerInfo[];
}

export const getPostLikes = async (postId: string): Promise<GetPostLikesResponse> => {
  const response = await api.get<GetPostLikesResponse>(`/post/${postId}/likes`);
  return response.data;
};

export const voteInPoll = async (postId: string, optionId: string, companyId?: string): Promise<{ message: string }> => {
  void companyId;
  const response = await api.post<{ message: string }>(`/post/${postId}/poll/vote`, { option_id: optionId });
  return response.data;
};

export const removeVote = async (postId: string, companyId?: string): Promise<{ message: string }> => {
  void companyId;
  const response = await api.delete<{ message: string }>(`/post/${postId}/poll/vote`);
  return response.data;
};

export const getPollAnalytics = async (postId: string): Promise<any> => {
  const response = await api.get<any>(`/post/${postId}/poll/analytics`);
  return response.data;
};

// Comments
export const addComment = async (postId: string, content: string, parent_id?: string | number | null, companyId?: string) => {
  const payload: any = { content, parent_id: parent_id || null };
  if (companyId) payload.companyId = companyId;
  const response = await api.post(`/post/${postId}/comments`, payload);
  return response.data;
};

export const updateComment = async (commentId: string, content: string, companyId?: string) => {
  const payload: any = { content };
  if (companyId) payload.companyId = companyId;
  const response = await api.put(`/comments/${commentId}`, payload);
  return response.data;
};

export const getComments = async (postId: string, companyId?: string, targetCommentId?: string): Promise<BackendComment[]> => {
  const params = new URLSearchParams();
  if (companyId) params.append('companyId', companyId);
  if (targetCommentId) params.append('target_comment_id', targetCommentId);
  const response = await api.get<BackendComment[]>(`/post/${postId}/comments?${params.toString()}`);
  return response.data;
};

export const deleteComment = async (commentId: string, companyId?: string) => {
  const config: any = {};
  if (companyId) config.data = { companyId };
  const response = await api.delete(`/comments/${commentId}`, config);
  return response.data;
};

export const hideComment = async (commentId: string | number, companyId?: string) => {
  const response = await api.post(`/comments/${commentId}/hide`, { companyId });
  return response.data;
};

export const unhideComment = async (commentId: string | number, companyId?: string) => {
  const response = await api.delete(`/comments/${commentId}/hide`, { data: { companyId } });
  return response.data;
};

export const getHiddenComments = async (companyId?: string) => {
  const response = await api.get(`/users/me/comments/hidden`, { params: { companyId } });
  return response.data;
};

export const toggleCommentLike = async (commentId: string | number, companyId?: string) => {
  void companyId;
  const response = await api.post(`/comments/${commentId}/like`);
  return response.data;
};

export const toggleCommentPin = async (commentId: string | number, companyId?: string) => {
  void companyId;
  const response = await api.post(`/comments/${commentId}/pin`);
  return response.data;
};

export const createRepost = async (postId: string, content: string = "", category: string = "Professional"): Promise<BackendPost> => {
  const response = await api.post<BackendPost>("/post", {
    shared_post_id: postId,
    content,
    category,
    visibility: 'public'
  });
  return response.data;
};

export const syncPostTags = async (postId: string, userIds: string[]): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/posts/tags/sync`, {
    postId,
    tags: userIds
  });
  return response.data;
};
