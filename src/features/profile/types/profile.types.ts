import { Experience, Education } from "@/types/entities";
import { User } from "@/types/user";

export interface ProfileIdentity {
  openTo: "Full-time" | "Part-time" | "Internship" | "Freelance" | "Connections";
  availability: "Immediately" | "Weekdays" | "Weekends" | "15 to 30 days" | "Flexible" | "On-demand" | "Immediate" | "30 Days";
  workPreference: "Remote" | "Hybrid" | "On-site";
}

export interface ProfileInsights {
  profileViews: number[];
  mostViewedSkills: string[];
  searchAppearances: number;
  profileStrength: number;
}

export interface FormattedExperience extends Experience {
  duration: string;
  company: string;
  id: string; // mapped from experience_id
}

export interface FormattedEducation extends Education {
  duration: string;
  school: string; // mapped from school_name
  fieldOfStudy: string; // mapped from field_of_study
  id: string; // mapped from education_id
}

export interface SavedRole {
  experience_id?: string;
  title: string;
  company_name: string;
  location: string;
  work_type: string;
  work_mode: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  description?: string;
  org_id?: string;
  shouldEndPreviousRole?: boolean;
  experienceIdToEnd?: string;
}

export type {
  UserProfile,
  AddExperiencePayload,
  AddExperienceResponse,
  AddEducationPayload,
  AddEducationResponse,
  AddSkillsPayload,
  AddSkillsResponse,
  SkillResponse,
  Skill,
  UpdateProfilePayload,
  UserData,
  CompanyRole,
} from "@/types/user";
