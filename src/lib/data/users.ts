import { User } from '@/types/user';
import { initialExperiences, initialEducations, initialSkills } from './profile';

export const users: User[] = [
  {
    id: "sally-liang",
    name: "Sally Liang",
    headline: "Senior Financial Analyst at Johnson & Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    location: "Berkeley, California, United States",
    about: "Passionate product manager with 7+ years of experience building user-centric solutions that drive business growth. Proven track record in agile development, user research, and cross-functional team leadership. Successfully launched 15+ features that improved user engagement by 40% and increased revenue by $2M annually.",
    skills: initialSkills,
    experiences: initialExperiences,
    educations: initialEducations,
    connectionStatus: 'none',
    mutualConnections: 0,
    isCurrentUser: true,
  },
  {
    id: "michael-chen",
    name: "Michael Chen",
    headline: "Senior React Developer | UI/UX Enthusiast",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    location: "San Francisco, California",
    about: "Frontend specialist with a passion for building performant and accessible web applications. I love React, TypeScript, and modern CSS.",
    skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Node.js", "Product Strategy"],
    experiences: [
      {
        experience_id: "101",
        profile_id: "michael-chen",
        title: "Senior Frontend Engineer",
        company_name: "TechCorp",
        location: "San Francisco, CA",
        start_date: "2021-01-01",
        end_date: null,
        employment_type: "Full-time",
        description: "Leading the frontend team in rebuilding the core product dashboard using Next.js and Tailwind.",
      },
      {
        experience_id: "102",
        profile_id: "michael-chen",
        title: "Frontend Developer",
        company_name: "StartUp Inc",
        location: "Remote",
        start_date: "2018-01-01",
        end_date: "2021-01-01",
        employment_type: "Full-time",
        description: "Built and maintained multiple client-facing applications.",
      }
    ],
    educations: [
      {
        education_id: "201",
        profile_id: "michael-chen",
        school_name: "University of California, Berkeley",
        degree: "Bachelor of Science",
        field_of_study: "Computer Science",
        start_date: "2014-01-01",
        end_date: "2018-01-01",
        description: "Graduated with Honors."
      }
    ],
    connectionStatus: 'connected',
    mutualConnections: 12,
  },
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    headline: "UX Designer at Design Studio",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    location: "New York, NY",
    about: "Creative UX Designer with a focus on human-centered design principles. I bridge the gap between user needs and business goals.",
    skills: ["Figma", "User Research", "Prototyping", "UI Design", "Adobe Creative Suite"],
    experiences: [
      {
        experience_id: "301",
        profile_id: "sarah-chen",
        title: "UX Designer",
        company_name: "Design Studio",
        location: "New York, NY",
        start_date: "2020-01-01",
        end_date: null,
        employment_type: "Full-time",
        description: "Designing intuitive interfaces for enterprise clients.",
      }
    ],
    educations: [],
    connectionStatus: 'pending',
    mutualConnections: 5,
  },
  {
    id: "david-park",
    name: "David Park",
    headline: "Product Manager | Agile Coach",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    location: "Austin, Texas",
    about: "Product leader experienced in managing cross-functional teams and delivering high-impact products.",
    skills: ["Product Management", "Agile", "Scrum", "Jira", "Strategy"],
    experiences: [],
    educations: [],
    connectionStatus: 'none',
    mutualConnections: 2,
  }
];
