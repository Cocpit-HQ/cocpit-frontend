import { ExtendedExperience, ProfileIdentity, ProfileInsights } from "@/types/profile";
import { Education } from "@/types/entities";

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

export const initialExperiences: ExtendedExperience[] = [
  {
    id: 1,
    title: "Senior Product Manager",
    company: "TechCorp Inc.",
    duration: "2021 - Present",
    location: "San Francisco, CA",
    description: "Leading product strategy and roadmap for core platform features. Managing cross-functional teams and driving product vision.",
    skills: ["Product Strategy", "Product Roadmapping", "Stakeholder Management", "Agile Development"],
  },
  {
    id: 2,
    title: "Product Manager",
    company: "StartupXYZ",
    duration: "2018 - 2021",
    location: "San Francisco, CA",
    description: "Launched 10+ features from concept to market. Collaborated with engineering and design teams to deliver user-centric solutions.",
    skills: ["User Research", "UX Design", "A/B Testing", "Figma"],
  },
];

export const initialEducations: Education[] = [
  {
    id: 1,
    school: "Stanford University",
    degree: "MBA",
    fieldOfStudy: "Business Administration",
    duration: "2016 - 2018",
    description: "Focus on Product Management and Entrepreneurship",
  }
];
