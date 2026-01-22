import type { LoadingState } from "@/types/common";

export interface StoryAuthor {
  id?: number;
  name: string;
  avatar: string;
}

export interface StoryCard {
  id: number;
  image: string;
  author: StoryAuthor;
  title: string;
  timeAgo: string;
  views: number;
  likes: number;
  comments?: number;
  isVideo?: boolean;
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
  created_at?: string; // Helpful for sorting check if needed
}

export interface StoryGroup {
  author: StoryAuthor;
  is_current_user: boolean;
  latest_story_at: string | null;
  stories: StoryDetail[];
}
