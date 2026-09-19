import { getUserById } from "@/services/api/user";
import { getPublicProfilePosts, type GetPublicProfilePostsOptions, type PublicPostsResponse, type PublicPost } from "@/services/api/public-profile";
import { getProfileStats } from "@/services/api/social";
import { recordProfileView, getProfileViewCount } from "@/services/api/dashboard";

export {
  getUserById,
  getPublicProfilePosts,
  getProfileStats,
  recordProfileView,
  getProfileViewCount
};
export type { GetPublicProfilePostsOptions, PublicPostsResponse, PublicPost };

