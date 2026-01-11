import api from "@/lib/axios";
import type { UserProfile, AddExperiencePayload, AddExperienceResponse, AddEducationPayload, AddEducationResponse, Skill } from "@/types/user";

export interface GetUserPostsParams {
  category?: 'All' | 'Personal' | 'Professional';
  limit?: number;
  cursorCreatedAt?: string;
  cursorPostId?: string;
}

export interface ProfilePostMedia {
  media_id: string;
  url: string;
  media_type: 'image' | 'video';
  aspect_ratio: string | null;
}

export interface ProfilePostPollOption {
  option_id: string;
  option_text: string;
  vote_count: number;
}

export interface ProfilePostPoll {
  poll_id: string;
  duration: string;
  total_votes: number;
  options: ProfilePostPollOption[];
}

export interface ProfilePost {
  post_id: string;
  content: string;
  created_at: string;
  visibility: 'public' | 'private';
  author_id: string;
  author_name: string;
  author_avatar: string;
  category_name: string;
  media: ProfilePostMedia[];
  like_count: string;
  comment_count: string;
  poll: ProfilePostPoll | null;
}

export interface GetUserPostsResponse {
  posts: ProfilePost[];
  nextCursor: {
    cursorCreatedAt: string;
    cursorPostId: string;
  } | null;
}

export interface AddSkillPayload {
    skill_name: string;
}

export interface AddSkillResponse {
    message: string;
    skill: Skill;
}

export const getProfile = async (): Promise<UserProfile> => {
    const response = await api.get("/profile/me");
    return response.data;
};

export const getUserPosts = async (params: GetUserPostsParams): Promise<GetUserPostsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.category && params.category !== 'All') queryParams.append('category', params.category);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.cursorCreatedAt) queryParams.append('cursorCreatedAt', params.cursorCreatedAt);
  if (params.cursorPostId) queryParams.append('cursorPostId', params.cursorPostId);

  const response = await api.get<GetUserPostsResponse>(`/users/me/posts?${queryParams.toString()}`);
  return response.data;
};

export const addExperience = async (payload: AddExperiencePayload): Promise<AddExperienceResponse> => {
    const response = await api.post("/profile/experiences", payload);
    return response.data;
}

export const deleteExperience = async (id: string): Promise<void> => {
    await api.delete(`/profile/experiences/${id}`);
}

export const addEducation = async (payload: AddEducationPayload): Promise<AddEducationResponse> => {
    const response = await api.post("/profile/educations", payload);
    return response.data;
}

export const deleteEducation = async (id: string): Promise<void> => {
    await api.delete(`/profile/educations/${id}`);
}

export const addSkill = async (payload: AddSkillPayload): Promise<AddSkillResponse> => {
    const response = await api.post("/profile/skills", payload);
    return response.data;
}

export const deleteSkill = async (id: string): Promise<void> => {
    await api.delete(`/profile/skills/${id}`);
}
