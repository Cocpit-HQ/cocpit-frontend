import { useQuery } from "@tanstack/react-query";
import { getPublicProfilePosts, type GetPublicProfilePostsOptions } from "../services/profile.service";
import { mapPublicPostToPost } from "@/lib/mappers/public-profile.mapper";

export function useProfilePosts(userId: string, filterOrOptions?: string | GetPublicProfilePostsOptions) {
  const options: GetPublicProfilePostsOptions =
    typeof filterOrOptions === "string"
      ? { filter: filterOrOptions, limit: 50 }
      : { limit: 50, ...filterOrOptions };

  return useQuery({
    queryKey: ["profile-posts", userId, options.filter, options.category, options.limit],
    queryFn: async () => {
      const data = await getPublicProfilePosts(userId, options.category || 'All', options);
      return data.posts.map(mapPublicPostToPost);
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

