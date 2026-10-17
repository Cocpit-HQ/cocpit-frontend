import api from "@/lib/axios";
import { FeedResponse } from "./feed";

export interface HashtagSuggestion {
  tag: string;
  usage_count: number;
}

export interface HashtagSearchResponse {
  tags: HashtagSuggestion[];
}

export const searchHashtags = async (query: string, signal?: AbortSignal): Promise<HashtagSearchResponse> => {
  const response = await api.get<HashtagSearchResponse>(`/hashtags/search?q=${encodeURIComponent(query)}`, { signal });
  return response.data;
};

export const getHashtagFeed = async (tag: string, cursorCreatedAt?: string, cursorPostId?: string): Promise<FeedResponse> => {
  const params = new URLSearchParams();
  if (cursorCreatedAt) params.append("cursorCreatedAt", cursorCreatedAt);
  if (cursorPostId) params.append("cursorPostId", cursorPostId);
  
  const response = await api.get<FeedResponse>(`/posts/hashtag/${encodeURIComponent(tag)}?${params.toString()}`);
  return response.data;
};

export const getTrendingHashtags = async (): Promise<HashtagSuggestion[]> => {
  try {
    const response = await api.get<HashtagSearchResponse>('/hashtags/trending');
    return response.data?.tags || [];
  } catch (err) {
    console.error("Trending error:", err);
    return [];
  }
};
