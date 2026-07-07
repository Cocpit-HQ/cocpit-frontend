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
  logo_url?: string | null;     // Logo from linked organization
  company_logo?: string | null; // Fallback logo field
}

export interface ApiEducation {
  education_id: string;
  school_name: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  school_logo?: string | null; // School/university logo
  school_org_id?: string | null; // School/university org id
}

export interface PublicUserProfileResponse {
  user: {
    id: string;
    account_name?: string;
    name: string;
    headline: string | null;
    avatar: string | null;
    cover_image: string | null;
    location: string | null;
    about: string | null;
    email: string;
    mobile_number: string | null;
    followers_count: number;
    following_count: number;
    connections_count: number;
    open_to: string[] | null;
    availability: string | null;
    work_preference: string | null;
    latest_education: { school: string; degree: string } | null;
    is_following: boolean;
    is_followed_by?: boolean;
    connection_request_status?: 'connected' | 'pending' | 'rejected' | 'blocked' | null;
    connection_request_id?: string | null;
    connection_request_sender?: 'me' | 'them' | null;
    created_at: string;
  };
  experiences: ApiExperience[];
  educations: ApiEducation[];
  skills: { skill_id: string; name: string }[];
  resume: { originalName: string; url: string } | null;
  is_following: boolean;
  is_followed_by?: boolean;
  connection_request_status?: 'connected' | 'pending' | 'rejected' | 'blocked' | null;
  connection_request_id?: string | null;
  connection_request_sender?: 'me' | 'them' | null;
  company_roles?: {
    company_id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    role: string;
    is_primary_display: boolean;
    is_role_visible?: boolean; // Optional as public profile filters hidden ones
    priority?: number;
  }[];
}
