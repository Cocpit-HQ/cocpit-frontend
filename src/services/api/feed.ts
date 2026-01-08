import api from "@/lib/axios";

export interface FeedResponse {
  posts: BackendPost[];
  nextCursor: {
    cursorCreatedAt: string;
    cursorPostId: string;
  } | null;
}

export interface BackendPost {
  post_id: string;
  content: string;
  created_at: string;
  visibility: 'public' | 'private';
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  category_name: string | null;
  media: BackendMedia[];
  poll: BackendPoll | null;
}

export interface BackendMedia {
  media_id: string;
  post_id: string;
  url: string;
  media_type: 'image' | 'video';
  aspect_ratio: string | null;
}

export interface BackendPoll {
  poll_id: string;
  options: BackendPollOption[];
  total_votes: number;
}

export interface BackendPollOption {
  option_id: string;
  option_text: string;
  vote_count: number;
}

export const getFeed = async (cursorCreatedAt?: string, cursorPostId?: string): Promise<FeedResponse> => {
  const params = new URLSearchParams();
  if (cursorCreatedAt) params.append("cursorCreatedAt", cursorCreatedAt);
  if (cursorPostId) params.append("cursorPostId", cursorPostId);

  const response = await api.get<FeedResponse>(`/All/feeds?${params.toString()}`);
  return response.data;
};
