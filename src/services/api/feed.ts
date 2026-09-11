import api from "@/lib/axios";

export interface FeedResponse {
  posts: BackendPost[];
  nextCursor: string | null;
  session_id?: string;
  hashtag?: {
    tag: string;
    usage_count: number;
  };
}

export interface EngineFeedItem {
  id: string;
  type: string;
  content: any;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
    verified: boolean;
  };
  score: number;
  slot_type: 'organic' | 'exploration' | 'opportunity';
  ranked_at: string;
  position: number;
  post_data?: BackendPost;
}

export interface EngineFeedResponse {
  ok: boolean;
  data: {
    items: EngineFeedItem[];
    cursor: string | null;
    has_more: boolean;
    session_id: string;
    served_at: string;
  };
  meta: {
    total_candidates: number;
    cache_hit: boolean;
    exploration_slots: number;
    ranking_version: string;
  };
}

export interface EngineFeedSession {
  ok: boolean;
  data: {
    session_id: string;
    cursor: string | null;
    seen_count: number;
    started_at: string;
    expires_at: string;
  };
}

export interface TrackEventRequest {
  event_type: 'impression' | 'click' | 'dwell' | 'share' | 'dismiss' | 'like' | 'comment';
  item_id: string;
  item_type: string;
  session_id: string;
  position: number;
  dwell_ms?: number;
  context?: 'home' | 'explore' | 'startup';
  metadata?: any;
}

export interface BackendPost {
  post_id: string;
  content: string;
  created_at: string;
  visibility: 'public' | 'private';
  author_id: string;
  created_by_user_id?: string;
  author_name: string;
  author_avatar: string | null;
  author_slug?: string;
  author_company_id?: string;
  is_organization_post?: boolean;
  category_name: 'Personal' | 'Professional' | 'Achievement' | 'Update' | 'Hiring' | 'Milestone' | 'Insight' | 'Article' | null;
  location?: string | null;
  tags?: any[];
  media: BackendMedia[];
  poll: BackendPoll | null;
  title?: string;
  post_type?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  external_share_count?: number;
  is_liked: boolean;
  is_reposted?: boolean;
  is_reposted_with_thoughts?: boolean;
  repost_id?: string | null;
  is_commented: boolean;
  is_saved: boolean;
  liked_users?: { username: string; avatar_url: string | null }[];
  shared_post?: {
    is_accessible: boolean;
    reason?: 'private' | 'personal_connection' | 'unknown' | 'deleted';
    post_id?: string;
    post_type?: string;
    content?: string;
    created_at?: string;
    author?: {
      user_id: string;
      author_org_id?: string;
      created_by_user_id?: string;
      full_name: string;
      avatar_url: string | null;
      author_slug?: string;
      is_organization_post?: boolean;
      author_headline?: string;
    };
    media?: BackendMedia[];
    like_count?: number;
    comment_count?: number;
    share_count?: number;
    external_share_count?: number;
    is_liked?: boolean;
    is_reposted?: boolean;
    is_reposted_with_thoughts?: boolean;
    is_commented?: boolean;
    is_saved?: boolean;
    liked_users?: { username: string; avatar_url: string | null }[];
    poll?: BackendPoll | null;
    shared_entity_type?: 'job' | 'post';
    job_id?: string;
    category_name?: string | null;
    title?: string;
    company_name?: string;
    location?: string;
    job_type?: string;
    work_mode?: string;
    salary_min?: number;
    salary_max?: number;
    company_logo?: string;
    is_active?: boolean;
    company_slug?: string;
    achievement_image_url?: string | null;
  } | null;
  is_broadcast?: boolean;
  sample_liker_username?: string | null;
  author_headline?: string;
  achievement_image_id?: number | null;
  achievement_image_key?: string | null;
  achievement_image_url?: string | null;
  achievement_image_title?: string | null;
  is_community_article?: boolean;
  author_org_id?: string;
  community_id?: string;
  _rankingMeta?: {
    score: number;
    slot_type: string;
    position: number;
  };
}

export interface BackendMedia {
  media_id: string;
  post_id: string;
  url: string;
  media_type: 'image' | 'video';
  width?: number;
  height?: number;
  aspect_ratio: string | null;
}

export interface BackendPoll {
  poll_id: string;
  options: BackendPollOption[];
  total_votes: number;
  duration: string;
  is_active: boolean;
  user_vote?: string | null;
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
  post_type: "text" | "image" | "video" | "poll" | "article";
  location?: string | null;
  media_urls?: string[];
  poll_options?: string[];
  poll_duration?: string;
  shared_post_id?: string;
  shared_job_id?: string;
  companyId?: string;
  is_broadcast?: boolean;
  achievement_image_id?: number;
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

/**
 * Shared shape-mapping from the /feed engine response into the FeedResponse
 * shape the frontend feed hooks expect. Used by both the client-side
 * getFeed() below and the server-side prefetch (lib/server-feed.ts) so SSR
 * and client always agree on post/cursor shape.
 */
export const mapEngineResponseToFeedResponse = (data: EngineFeedResponse): FeedResponse => {
  if (!data.ok || !data.data) {
    return { posts: [], nextCursor: null };
  }

  const { items, cursor: nextCursorString, session_id } = data.data;

  if (!items || items.length === 0) {
    return {
      posts: [],
      nextCursor: null,
      session_id
    };
  }

  // Use backend-hydrated posts directly
  const hydratedPosts = items.map((item) => {
    if (!item.post_data) return null;

    return {
      ...item.post_data,
      _rankingMeta: {
        score: item.score,
        slot_type: item.slot_type,
        position: item.position
      }
    };
  }).filter(Boolean) as BackendPost[];

  return {
    posts: hydratedPosts,
    // If we received fewer items than requested, or items is empty, there are no more posts.
    nextCursor: items.length === 0 ? null : nextCursorString,
    session_id
  };
};

export const getFeed = async (cursor?: string, companyId?: string, algorithm?: boolean): Promise<FeedResponse> => {
  const params = new URLSearchParams();
  if (cursor && typeof cursor === 'string') {
    params.append("cursor", cursor);
  }
  if (algorithm !== undefined) {
    params.append("algorithm", String(algorithm));
  }
  void companyId; // Feed context might not use this in the same way, but keeping it for now

  const response = await api.get<EngineFeedResponse>(`/feed?${params.toString()}`);
  return mapEngineResponseToFeedResponse(response.data);
};

export const getFeedSession = async (): Promise<EngineFeedSession> => {
  const response = await api.get<EngineFeedSession>("/feed/session");
  return response.data;
};

export const resetFeedSession = async (): Promise<{ ok: boolean; message: string }> => {
  const response = await api.delete<{ ok: boolean; message: string }>("/feed/session");
  return response.data;
};

export const trackFeedEvent = async (data: TrackEventRequest): Promise<{ ok: boolean; message: string }> => {
  const response = await api.post<{ ok: boolean; message: string }>("/feed/event", data);
  return response.data;
};

export const createPost = async (data: CreatePostRequest): Promise<CreatePostResponse> => {
  const response = await api.post<CreatePostResponse>("/post", data);
  return response.data;
};

export const getPostById = async (id: string, companyId?: string): Promise<BackendPost> => {
  void companyId;
  const response = await api.get<BackendPost>(`/post/${id}`);
  return response.data;
};

export const hidePost = async (data: { item_id: string; session_id: string; position: number }): Promise<{ ok: boolean; message: string }> => {
  const response = await api.post<{ ok: boolean; message: string }>("/feed/hide", data);
  return response.data;
};

export const unhidePost = async (data: { item_id: string; session_id: string; position: number }): Promise<{ ok: boolean; message: string }> => {
  const response = await api.post<{ ok: boolean; message: string }>("/feed/unhide", data);
  return response.data;
};

export const submitPostFeedback = async (data: { item_id: string; type: 'INTERESTED' | 'NOT_INTERESTED'; session_id: string; position: number }): Promise<{ ok: boolean; message: string }> => {
  const response = await api.post<{ ok: boolean; message: string }>("/feed/postfeedback", data);
  return response.data;
};

export const getAchievementImages = async (): Promise<{ id: number; key: string; title: string; url: string; }[]> => {
  const response = await api.get<{ success: boolean; data: { id: number; key: string; title: string; url: string; }[] }>("/achievement-images");
  return response.data.data;
};
