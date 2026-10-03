import { Experience, Education, ExperienceGroup, Project } from './entities';
import { ProfileIdentity } from './profile';
import { ProfileScoreResponse } from '@/features/profile-score/types/profileScore.types';

export interface User {
  id: string;
  account_name?: string;
  name: string;
  headline: string;
  avatar: string; // URL or path
  location: string;
  website?: string;
  about: string;
  skills: string[];
  experiences: Experience[];
  educations: Education[];
  projects?: Project[];
  connectionStatus: 'connected' | 'pending' | 'none';
  mutualConnections: number; // Mock count
  followers_count?: number;
  following_count?: number;
  connections_count?: number;
  isCurrentUser?: boolean;
  identity?: ProfileIdentity;
  is_following?: boolean;
  is_followed_by?: boolean;
  cover_image?: string | null;
  email?: string | null;
  mobile_number?: string | null;
  show_email?: boolean;
  show_phone?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  connection_request_status?: 'connected' | 'pending' | 'rejected' | 'blocked' | null;
  connection_request_id?: string | null;
  connection_request_sender?: 'me' | 'them' | null;
  company_roles?: CompanyRole[];
  version?: number;
  resume?: {
    url: string;
    originalName: string;
  } | null;
  created_at?: string;
  is_identity_verified?: boolean;
  is_blocked_by_me?: boolean;
  profile_score?: ProfileScoreResponse;
}

export interface CompanyRole {
  company_id: string;
  org_id?: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: string;
  is_primary_display: boolean;
  is_role_visible?: boolean;
  priority?: number;
}

export interface UserProfile {
  user: UserData;
  experiences: Experience[];
  educations: Education[];
  skills: SkillResponse[];
  projects?: Project[];
  company_roles?: CompanyRole[];
  profile_views_count?: number;
  search_appearances_count?: number;
  resume?: {
    url: string;
    originalName: string;
  } | null;
  profile_score?: ProfileScoreResponse;
}

export interface UserData {
  id: string;
  account_name?: string;
  name: string;
  headline: string | null;
  avatar: string | null;
  cover_image: string | null;
  location: string | null;
  about: string | null;
  email: string;
  mobile_number?: string;
  show_email?: boolean;
  show_phone?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  account_type?: string | null;
  open_to: string | null;
  availability: string | null;
  work_preference: string | null;
  followers_count: number;
  following_count: number;
  connections_count: number;
  is_identity_verified?: boolean;
  is_blocked_by_me?: boolean;
  created_at?: string;
  latest_education: {
    school: string;
    degree: string;
    school_logo?: string | null;
  } | null;
  job_title?: string;
  company_name?: string;
  school?: string;
  degree?: string;
  website?: string | null;
  about_text?: string;
  is_following?: boolean;
  is_followed_by?: boolean;
  connection_request_status?: 'connected' | 'pending' | 'rejected' | 'blocked' | null;
  connection_request_id?: string | null;
  connection_request_sender?: 'me' | 'them' | null;
  company_roles?: CompanyRole[];
  version: number;
  onboarding_step?: string | null;
  // Structured location fields (populated during onboarding, used for state rehydration)
  location_formatted?: string | null;
  location_country?: string | null;
  location_state?: string | null;
  location_city?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_place_id?: string | null;
  // Role and skills (used for onboarding state rehydration on refresh)
  user_role?: string | null;
  skill_names?: string[];
  interest_names?: string[];
  industry?: string | null;
  working_industry?: string | null;
  dob?: string | null;
}

export interface UpdateProfilePayload {
  full_name: string;
  headline: string;
  job_title: string;
  company_name: string;
  school: string;
  degree: string;
  location: string;
  about_text: string;
  mobile_number?: string;
  account_name?: string;
  website?: string;
  visible_role_ids?: string[];
  industry?: string;
}

export interface Skill {
  skill_id: string;
  name: string;
}
// --- Skill Interfaces ---
export interface AddSkillsPayload {
  name: string[]; // array of skill names
}

export interface SkillResponse {
  skill_id: string;
  name: string; // Skill name
}

export interface AddSkillsResponse {
  message: string;       // Success message from backend
  skills: SkillResponse[]; // Array of added skills
}

export interface AddExperiencePayload {
  title: string;
  company_name: string;
  org_id?: string | null;
  location: string;
  work_type: string | null;
  work_mode: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  // ── Atomic end-role fields (optional) ────────────────────────────────────
  end_current_role?: boolean;       // if true, end an existing active role atomically
  end_current_role_id?: string;     // UUID of the experience to end (required when flag is true)
}

export interface AddExperienceResponse {
  message: string;
  experience: Experience;
  ended_experience?: Experience;  // present when end_current_role was true
  warning?: string;               // non-blocking advisory from backend
}

export interface AddEducationPayload {
  school_name: string;
  school_org_id?: string | null;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string | null;
  location?: string;
  description: string | null;
}

export interface AddEducationResponse {
  message: string;
  education: Education;
}

export interface SearchedUser {
  id: string;
  full_name: string;
  name?: string;
  account_name?: string;
  headline: string | null;
  avatar_url: string | null;
  avatar?: string | null;
  account_type: string;
  type?: 'USER' | 'COMPANY';
  slug?: string;
  industry?: string | null;
  website?: string | null;
}
