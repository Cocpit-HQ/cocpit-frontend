import { Experience } from "@/types/entities";

export interface ProfileIdentity {
  openTo: "Full-time" | "Freelance" | "Consulting" | "Mentorship";
  availability: "Immediate" | "30 Days" | "Casual Networking";
  workPreference: "Remote" | "Hybrid" | "Onsite";
}

export interface ProfileInsights {
  profileViews: number[];
  mostViewedSkills: string[];
  searchAppearances: number;
  profileStrength: number;
}

export interface ExtendedExperience extends Experience {
  skills: string[];
}
