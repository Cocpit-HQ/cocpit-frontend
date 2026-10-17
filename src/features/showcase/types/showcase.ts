import type { LoadingState } from "@/types/common";

export interface StoryAuthor {
  id?: string | number;
  name: string;
  avatar: string | null;
  is_company?: boolean;
}

export interface StoryCard {
  id: number;
  image: string;
  author: StoryAuthor;
  title: string;
  timeAgo: string;
  views: number;
  likes: number;
  comment_count?: number;
  poll?: unknown;
  isVideo?: boolean;
  story_metadata?: {
    backgroundStyle?: string;
    scale?: number;
    [key: string]: unknown;
  };
}

export interface ShowcaseState extends LoadingState {
  data?: StoryCard[];
}

export interface StoryDetail extends StoryCard {
  authorTitle?: string;
  description?: string;
  viewers?: StoryAuthor[];
  likers?: StoryAuthor[];
  isAuthor?: boolean;
  isLiked?: boolean;
  has_viewed?: boolean;
  is_seen?: boolean;
  created_at?: string;
  media_type?: 'image' | 'video';
  media_url?: string;
  thumbnail_url?: string;
  shared_post?: {
    is_accessible: boolean;
    reason?: 'private' | 'personal_connection' | 'unknown';
    post_id?: string;
    content?: string;
    author?: {
      user_id: string;
      full_name: string;
      avatar_url: string;
    };
    media?: { url: string; media_type: string }[];
  };
}

export interface StoryGroup {
  author: StoryAuthor;
  is_current_user: boolean;
  latest_story_at: string | null;
  stories: StoryDetail[];
}
