import { Experience, Education } from './entities';
import { ProfileIdentity } from './profile';

export interface User {
  id: string;
  name: string;
  headline: string;
  avatar: string; // URL or path
  location: string;
  about: string;
  skills: string[];
  experiences: Experience[];
  educations: Education[];
  connectionStatus: 'connected' | 'pending' | 'none';
  mutualConnections: number; // Mock count
  isCurrentUser?: boolean;
  identity?: ProfileIdentity;
}

export interface UserProfile {
  user: UserData;
  experiences: Experience[];
  educations: Education[];
  skills: SkillResponse[];
  profile_views_count?: number;
  search_appearances_count?: number;
  resume?: {
    url: string;
    originalName: string;
  } | null;
}

export interface UserData {
  id: string;
  name: string;
  headline: string | null;
  avatar: string | null;
  cover_image: string | null;
  location: string | null;
  about: string | null;
  email: string;
  phone?: string;
  open_to: string | null;
  availability: string | null;
  work_preference: string | null;
  profile_views: number;
  search_appearances: number;
  latest_education: {
    school: string;
    degree: string;
  } | null;
  job_title?: string;
  company_name?: string;
  school?: string;
  degree?: string;
  about_text?: string;
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
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

export interface AddExperienceResponse {
  message: string;
  experience: Experience;
}

export interface AddEducationPayload {
  school_name: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string | null;
  description: string | null;
}

export interface AddEducationResponse {
  message: string;
  education: Education;
}

export interface SearchedUser {
  id: string;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
  account_type: string;
}
