/**
 * API Response Types
 * Standard response format for all API endpoints
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
}

export interface ApiExperience {
  experience_id: string;
  title: string;
  company_name: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

export interface ApiEducation {
  education_id: string;
  school_name: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
}

export interface PublicUserProfileResponse {
  id: string;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
  location: string | null;
  about_text: string | null;
  created_at: string;
  account_type: string;
  open_to: string[] | null;
  availability: string | null;
  work_preference: string | null;
  experiences: ApiExperience[];
  educations: ApiEducation[];
  skills: string[];
}

export interface PostMedia {
  media_id: string;
  post_id: string;
  url: string;
  media_type: "image" | "video";
  aspect_ratio: number | null;
}

export interface PollOption {
  option_id: string;
  option_text: string;
  vote_count: number;
}

export interface PostPoll {
  poll_id: string;
  duration?: number;
  total_votes: number;
  options: PollOption[];
}

export interface ApiPost {
  post_id: string;
  author_id: string;
  category_id: string;
  content: string;
  visibility: "public" | "private" | "friends-only";
  created_at: string;
  updated_at: string;
  post_type: "text" | "image" | "video" | "poll" | "article";
  title: string;
  author_name: string;
  author_avatar: string;
  category_name: string;
  media: PostMedia[];
  poll: PostPoll | null;
}

export interface FeedApiResponse {
  posts: ApiPost[];
  nextCursor?: string;
}
