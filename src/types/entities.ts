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
    experience_id: string;
    profile_id: string;
    title: string;
    company_name: string;
    start_date: string;
    end_date: string | null;
    employment_type: string;
    location: string;
    description: string | null;
}

export interface Education {
    education_id: string;
    profile_id: string;
    school_name: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string | null;
    description: string | null;
}

export interface Comment {
  id: number;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  timeAgo: string;
  likes: number;
}

export interface PollOption {
  option_id: string;
  option_text: string;
  vote_count: number;
}

export interface Poll {
  poll_id: string;
  options: PollOption[];
  total_votes: number;
}

export interface Post {
  id: string;
  author: string;
  title: string;
  timeAgo: string;
  content: string;
  imageSrc?: string;
  images?: string[];
  videoSrc?: string;
  aspectRatio?: string;
  likes: string;
  comments: string;
  shares: string;
  commentData?: Comment[];
  category?: 'Personal' | 'Professional' | 'Achievement';
  visibility?: 'public' | 'private';
  poll?: Poll | null;
}