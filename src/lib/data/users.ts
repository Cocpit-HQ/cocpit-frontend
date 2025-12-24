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
        id: 101,
        title: "Senior Frontend Engineer",
        company: "TechCorp",
        location: "San Francisco, CA",
        duration: "2021 - Present",
        description: "Leading the frontend team in rebuilding the core product dashboard using Next.js and Tailwind.",
        skills: ["React", "TypeScript"]
      },
      {
        id: 102,
        title: "Frontend Developer",
        company: "StartUp Inc",
        location: "Remote",
        duration: "2018 - 2021",
        description: "Built and maintained multiple client-facing applications.",
        skills: ["React", "JavaScript"]
      }
    ],
    educations: [
      {
        id: 201,
        school: "University of California, Berkeley",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        duration: "2014 - 2018",
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
        id: 301,
        title: "UX Designer",
        company: "Design Studio",
        location: "New York, NY",
        duration: "2020 - Present",
        description: "Designing intuitive interfaces for enterprise clients.",
        skills: ["Figma", "UI Design"]
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
