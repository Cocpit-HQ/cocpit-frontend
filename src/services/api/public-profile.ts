import api from '@/lib/axios';

export interface PublicPost {
  post_id: string;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
  title: string | null;
  category_id: string;
  content: string;
  created_at: string;
}

export interface PublicPostsResponse {
  category: string;
  posts: PublicPost[];
}

export const getPublicProfilePosts = async (userId: string, category: string): Promise<PublicPostsResponse> => {
  // Using GET with a body (data property) as per user instruction and backend requirement.
  const response = await api.get<PublicPostsResponse>(`/users/${userId}/posts`, {
    data: { category }
  });
  return response.data;
};
