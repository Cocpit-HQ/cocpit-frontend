export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  headline?: string;
  jobTitle?: string;
  company?: string;
  school?: string;
  degree?: string;
  location?: string;
  about?: string;
  avatar?: string;
}

export interface Experience {
  id: number;
  title: string;
  company: string;
  duration: string;
  location: string;
  description: string;
}

export interface Education {
  id: number;
  school: string;
  degree: string;
  fieldOfStudy: string;
  duration: string;
  description: string;
}