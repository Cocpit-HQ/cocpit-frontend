import type { LoadingState } from "@/types/common";

export interface StoryAuthor {
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
}

