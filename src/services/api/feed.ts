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

export interface CreatePostRequest {
  title: string;
  content: string;
  category: string;
  visibility: "public" | "private";
  post_type: "text" | "image" | "video" | "poll";
  media_urls?: string[];
  poll_options?: string[];
  poll_duration?: string;
}

export interface CreatePostResponse {
  message: string;
  postId: string;
  title: string;
  content: string;
  category: string;
  visibility: string;
  post_type: string;
  media_urls?: string[];
  media_type?: string;
  poll: {
    poll_id?: string;
    duration?: string;
    options?: string[];
    // Include extra fields that might return from backend or that we need to be loose about
    total_votes?: number;
  } | Record<string, never> | null;
}

export const getFeed = async (cursorCreatedAt?: string, cursorPostId?: string): Promise<FeedResponse> => {
  const params = new URLSearchParams();
  if (cursorCreatedAt) params.append("cursorCreatedAt", cursorCreatedAt);
  if (cursorPostId) params.append("cursorPostId", cursorPostId);

  const response = await api.get<FeedResponse>(`/All/feeds?${params.toString()}`);
  return response.data;
};

export const createPost = async (data: CreatePostRequest): Promise<CreatePostResponse> => {
  const response = await api.post<CreatePostResponse>('/post', data);
  return response.data;
};
