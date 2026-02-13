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
  id: string | number;
  authorId?: string; // Added for permission checks
  author: {
    name: string;
    avatar: string;
    account_name?: string; // Added for mentions
    authorSlug?: string;
    isCompanyPost?: boolean;
  };
  text: string;
  timeAgo: string;
  created_at: string; // For sorting
  like_count: number; // Changed from 'likes' to match backend
  is_liked: boolean; // Added to track if current user liked
  parent_id?: string | number | null; // For reply relationships
  is_pinned?: boolean; // For pinning
  pinned_at?: string | null; // When it was pinned
  pinned_by?: string | null; // Who pinned it
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

  duration: string; // e.g. "1 week"
  user_vote?: string | null; // option_id of the voted option
  is_active?: boolean; // backend calculated status
}

export type PostVisibility = 'public' | 'private';

export interface Post {
  id: string;
  authorId: string;
  author: string;
  authorAvatar?: string;
  authorSlug?: string;
  isCompanyPost?: boolean;
  title?: string | null;
  timeAgo: string;
  content: string;
  imageSrc?: string;
  images?: string[];
  videoSrc?: string;
  aspectRatio?: string;
  likes: number;
  isLiked?: boolean;
  comments: string;
  shares: string;
  commentData?: Comment[];
  category?: 'Personal' | 'Professional' | 'Achievement';
  visibility?: PostVisibility;
  poll?: Poll | null;
  shared_post?: Post | null;
  isAvailable?: boolean;
  unavailableReason?: 'private' | 'personal_connection' | 'unknown' | 'deleted';
}