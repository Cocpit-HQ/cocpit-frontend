import { Experience } from "@/types/entities";

export interface ProfileIdentity {
  openTo?: "Full-time" | "Part-time" | "Internship" | "Freelance" | "Connections" | string;
  availability?: "Immediately" | "Weekdays" | "Weekends" | "15 to 30 days" | "Flexible" | "On-demand" | "Immediate" | "30 Days" | string;
  workPreference?: "Remote" | "Hybrid" | "On-site" | "Onsite" | string;
}

export interface ProfileInsights {
  profileViews: number[];
  mostViewedSkills: string[];
  searchAppearances: number;
  profileStrength: number;
}


