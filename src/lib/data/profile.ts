import { ProfileIdentity, ProfileInsights } from "@/types/profile";
import { Education, Experience } from "@/types/entities";

export const initialIdentity: ProfileIdentity = {
  openTo: "Full-time",
  availability: "Immediate",
  workPreference: "Hybrid",
};

export const initialInsights: ProfileInsights = {
  profileViews: [120, 145, 132, 160, 185, 210, 230], // Mock trend data
  mostViewedSkills: ["Product Strategy", "Data Analysis", "User Research"],
  searchAppearances: 45,
  profileStrength: 85,
};

export const initialSkills = [
  "Product Strategy",
  "User Research",
  "Data Analysis",
  "Agile Development",
  "A/B Testing",
  "Product Roadmapping",
  "Stakeholder Management",
  "UX Design",
  "SQL",
  "Python",
  "Figma",
  "Jira",
];

export const initialExperiences: Experience[] = [
  {
    experience_id: "1",
    profile_id: "1",
    org_id: null,
    logo_url: null,
    title: "Senior Product Manager",
    company_name: "TechCorp Inc.",
    start_date: "2021-01-01",
    end_date: null,
    work_type: "Full-time",
    work_mode: "On-site",
    is_current: true,
    location: "San Francisco, CA",
    description: "Leading product strategy and roadmap for core platform features. Managing cross-functional teams and driving product vision.",
  },
  {
    experience_id: "2",
    profile_id: "1",
    org_id: null,
    logo_url: null,
    title: "Product Manager",
    company_name: "StartupXYZ",
    start_date: "2018-01-01",
    end_date: "2021-01-01",
    work_type: "Full-time",
    work_mode: "On-site",
    is_current: false,
    location: "San Francisco, CA",
    description: "Launched 10+ features from concept to market. Collaborated with engineering and design teams to deliver user-centric solutions.",
  },
];

export const initialEducations: Education[] = [
  {
    education_id: "1",
    profile_id: "1",
    school_name: "Stanford University",
    degree: "MBA",
    field_of_study: "Business Administration",
    start_date: "2016-01-01",
    end_date: "2018-01-01",
    description: "Focus on Product Management and Entrepreneurship",
  }
];
