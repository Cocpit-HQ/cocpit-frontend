import { Experience, Education } from './entities';

export interface User {
  id: string;
  name:string;
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
}

export interface UserProfile {
  user: UserData;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
}

export interface UserData {
    id: string;
    name: string;
    headline: string | null;
    avatar: string | null;
    location: string | null;
    about: string | null;
    email: string;
    open_to: string[] | null;
    availability: string | null;
    work_preference: string | null;
    profile_views: number;
    search_appearances: number;
    latest_education: {
        school: string;
        degree: string;
    } | null;
}

export interface Skill {
    skill_id: string;
    profile_id: string;
    skill_name: string;
    created_at: string;
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
    end_date?: string;
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
