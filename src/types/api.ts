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
  is_following: boolean;
  is_followed_by?: boolean;
  connection_request_status?: 'pending' | 'rejected' | 'blocked' | null;
  connection_request_id?: string | null;
  connection_request_sender?: 'me' | 'them' | null;
}
