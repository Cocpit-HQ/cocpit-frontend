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
  org_id: string | null;      // Link to organization
  logo_url: string | null;    // Logo from linked organization
  company_logo?: string | null;
  title: string;
  company_name: string;
  location: string;
  work_type: string | null;
  work_mode: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  skills?: string[] | any[];
}

/** Grouped structure returned by backend getExperiences() via groupByCompany() */
export interface ExperienceGroup {
  company_name: string;
  logo_url: string | null;
  experiences: Experience[];
}

export interface Education {
  education_id: string;
  profile_id: string;
  school_name: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  location?: string;
  description: string | null;
  school_logo?: string | null;
  school_org_id?: string | null;
}

export interface ProjectMedia {
  id: string;
  type: 'link' | 'image' | 'document';
  title: string;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  pendingFile?: File;
}

export interface Project {
  project_id: string;
  profile_id?: string;
  title: string;
  organization: string;
  details?: string;
  start_month: string;
  start_year: string;
  end_month?: string;
  end_year?: string;
  is_current: boolean;
  skills: string[];
  media: ProjectMedia[];
  role?: string;
  team_size?: string;
  role_description?: string;
}

export interface Comment {
  id: string | number;
  authorId?: string; // Added for permission checks
  author: {
    name: string;
    avatar?: string;
    account_name?: string; // Added for mentions
    authorSlug?: string;
    isCompanyPost?: boolean;
    headline?: string;
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
  isPending?: boolean; // For optimistic UI
  reply_count?: number; // Added for UI display
  is_edited?: boolean; // Whether the comment has been edited
  mentioned_users?: { user_id: string; full_name: string; account_name: string }[];
  actionState?: {
    type: 'hidden' | 'deleted' | 'reported';
    toastId?: string | number;
  };
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

export interface SavedFolder {
  folder_id: string;
  user_id: string;
  name: string;
  post_count: number;
  created_at: string;
  cover_image?: string;
}

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
  mentioned_users?: { user_id: string; full_name: string; account_name: string }[];
  imageSrc?: string;
  images?: string[];
  imageDimensions?: Array<{ width: number; height: number } | null>;
  mediaWidth?: number;
  mediaHeight?: number;
  videoSrc?: string;
  aspectRatio?: string;
  media?: any[];
  likes: number;
  isLiked?: boolean;
  isReposted?: boolean;
  isRepostedWithThoughts?: boolean;
  repostId?: string | null;
  is_commented?: boolean;
  is_saved?: boolean;
  is_reported?: boolean;
  isReported?: boolean;
  likedUsers?: { username: string; avatar_url: string | null }[];
  comments: string;
  shares: string;
  externalShares?: string | number;
  commentData?: Comment[];
  category?: 'Personal' | 'Professional' | 'Achievement' | 'Update' | 'Hiring' | 'Milestone' | 'Insight' | 'Article';
  visibility?: PostVisibility;
  is_unlisted?: boolean;
  appealStatus?: 'pending' | 'rejected' | 'approved';
  poll?: Poll | null;
  shared_post?: Post | null;
  isAvailable?: boolean;
  sampleLikerUsername?: string | null;
  authorHeadline?: string | null;
  unavailableReason?: 'private' | 'personal_connection' | 'unknown' | 'deleted';
  articleBody?: string;

  // Job sharing fields
  isJob?: boolean;
  jobId?: string;
  jobTitle?: string;
  jobLocation?: string;
  jobCompany?: string;
  jobLogo?: string;
  jobType?: string;
  jobWorkMode?: string;
  jobSalaryMin?: number;
  jobSalaryMax?: number;
  jobIsActive?: boolean;
  // Broadcast fields
  is_broadcast?: boolean;
  broadcastOrgName?: string;
  tags?: any[];
  location?: string;

  // Feed Engine Ranking fields
  rankingScore?: number;
  slotType?: string;
  position?: number;
  type?: string;
  post_type?: string;
  achievementImageId?: number;
  achievementImageUrl?: string;
  achievementImageTitle?: string;
  achievementImageKey?: string;
  is_community_article?: boolean;
  author_org_id?: string;
  createdByUserId?: string;
  communityId?: string;
}