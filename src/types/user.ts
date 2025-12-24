import { Experience, Education, Post } from './entities';

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
}

export interface PublicProfile extends User {
  // Add specific fields if needed for public view logic,
  // currently User interface covers it.
}
