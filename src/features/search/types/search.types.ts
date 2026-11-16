import { Job } from '@/features/jobs/types/jobs.types';

export type SearchCategory = 'all' | 'people' | 'jobs' | 'companies' | 'institutes' | 'posts' | 'hashtags';

export interface SearchPersonItem {
  id: string;
  name: string;
  account_name: string;
  headline?: string | null;
  avatar_url?: string | null;
  account_type?: string;
  mutual_connections?: number;
  is_following?: boolean;
  connections_count?: number;
  connection_status?: 'connected' | 'pending_sent' | 'pending_received' | 'none';
  pending_request_id?: string | null;
  is_connected?: boolean;
  has_pending_request?: boolean;
  is_self?: boolean;
  context_signal?: string | null;
  location?: string | null;
  location_city?: string | null;
  mutual_avatars?: string[];
  context_type?: 'mutuals' | 'education' | 'company' | 'skill' | 'location' | null;
}

export interface SearchCompanyItem {
  id: string;
  name: string;
  slug?: string;
  headline?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  industry?: string | null;
  location?: string | null;
  is_verified?: boolean;
  is_following?: boolean;
  followers_count?: number;
  message_permission?: 'everyone' | 'followers_only' | 'no_one';
  messages_enabled?: boolean;
  is_self?: boolean;
  can_message?: boolean;
  context_signal?: string | null;
  context_type?: 'connections' | 'employment' | 'headline' | 'industry_location' | 'industry' | 'location' | null;
  relevance_score?: number;
}

export interface SearchInstituteItem {
  id: string;
  name: string;
  slug?: string;
  headline?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  institution_type?: string | null;
  campus_location?: string | null;
  location?: string | null;
  is_verified?: boolean;
  is_following?: boolean;
  followers_count?: number;
  message_permission?: 'everyone' | 'followers_only' | 'no_one';
  messages_enabled?: boolean;
  is_self?: boolean;
  can_message?: boolean;
  context_signal?: string | null;
  context_type?: 'studied_here' | 'alumni_network' | 'headline' | 'type_location' | 'type' | 'location' | null;
  relevance_score?: number;
}

export interface SearchHashtagItem {
  id?: string;
  tag: string;
  display_tag?: string;
  usage_count?: number;
  post_count?: number;
  posts_count?: number;
  posts_display?: string;
  created_at?: string;
  sort_rank?: number;
}

export interface SearchCategoryResult<T> {
  status: 'success' | 'error';
  items?: T[];
  error_code?: string;
  total_estimated?: number;
  has_more?: boolean;
}

export interface StageAResults {
  people?: SearchCategoryResult<SearchPersonItem>;
  jobs?: SearchCategoryResult<Job>;
  companies?: SearchCategoryResult<SearchCompanyItem>;
  institutes?: SearchCategoryResult<SearchInstituteItem>;
  posts?: SearchCategoryResult<any>;
  hashtags?: SearchCategoryResult<SearchHashtagItem>;
}

export interface StageAResponse {
  status?: 'success' | 'error';
  query: string;
  type: 'all';
  sections?: StageAResults;
  results?: StageAResults;
}

export interface StageBCategoryResponse<T> {
  status?: 'success' | 'error';
  query: string;
  type: SearchCategory;
  items: T[];
  next_cursor?: string | null;
  has_more: boolean;
  pagination?: {
    limit?: number;
    next_cursor?: string | null;
    has_more?: boolean;
  };
}

export interface SearchFilterState {
  // Jobs
  job_type?: string[];
  experience_level?: string[];
  work_mode?: string[];
  min_salary?: string;
  max_salary?: string;
  salary_range?: string[];
  industry?: string[];
  industry_type?: string[];
  date_posted?: string;
  company?: string[];
  is_verified?: boolean;
  // People & Common
  location?: string | string[];
  role?: string | string[];
  institute?: string[];
  school?: string[];
  // Institutes & Companies
  institute_type?: string[];
  org_size?: string | string[];
  type?: string | string[];
  org_type?: string | string[];
  actively_hiring?: boolean;
  // Posts
  content_type?: string | string[];
  posted_by?: string | string[];
  hashtag?: string[];
  sort_by?: string;
}

export interface GlobalSearchParams {
  q: string;
  type?: SearchCategory;
  cursor?: string | null;
  limit?: number;
  filters?: SearchFilterState;
}
