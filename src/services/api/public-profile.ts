import api from '@/lib/axios';

export interface PublicPostMedia {
  media_id: string;
  url: string;
  media_type: 'image' | 'video';
  aspect_ratio?: string;
}

export interface PublicPostPollOption {
  option_id: string;
  option_text: string;
  vote_count: number;
}

export interface PublicPostPoll {
  poll_id: string;
  duration: string;
  total_votes: number;
  is_active: boolean;
  user_vote?: string | null;
  options: PublicPostPollOption[];
}

export interface PublicPost {
  post_id: string;
  title?: string | null;
  content: string;
  created_at: string;
  visibility: 'public' | 'private' | 'connections';
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  category_name: string | null;
  media: PublicPostMedia[];
  like_count: number;
  is_liked: boolean;
  is_reposted?: boolean;
  repost_id?: string | null;
  is_commented: boolean;
  is_saved: boolean;
  liked_users?: { username: string; avatar_url: string | null }[];
  comment_count: number;
  share_count?: number;
  poll: PublicPostPoll | null;
  location?: string | null;
  tags?: any[];
  sample_liker_username?: string | null;
  author_headline?: string;
  shared_post?: {
    is_accessible: boolean;
    reason?: 'private' | 'personal_connection' | 'unknown' | 'deleted';
    post_id?: string;
    title?: string | null;
    content?: string;
    created_at?: string;
    author?: {
      user_id: string;
      full_name: string;
      avatar_url: string | null;
    };
    media?: { url: string; media_type: 'image' | 'video' }[];
    like_count?: number;
    comment_count?: number;
    share_count?: number;
    is_liked?: boolean;
    is_reposted?: boolean;
    is_commented?: boolean;
    is_saved?: boolean;
    liked_users?: { username: string; avatar_url: string | null }[];
    poll?: PublicPostPoll | null;
  };
}

export interface PublicPostsResponse {
  posts: PublicPost[];
  nextCursor: {
    cursorCreatedAt: string;
    cursorPostId: string;
  } | null;
}

export const getPublicProfilePosts = async (userId: string, category: string): Promise<PublicPostsResponse> => {
  // Using query params as per updated backend requirement
  const response = await api.get<PublicPostsResponse>(`/users/${userId}/posts`, {
    params: { category }
  });
  return response.data;
};
