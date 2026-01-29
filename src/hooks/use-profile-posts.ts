
import { useQuery } from "@tanstack/react-query";
import { getPublicProfilePosts } from "@/services/api/public-profile";
import { mapPublicPostToPost } from "@/lib/mappers/public-profile.mapper";

export function useProfilePosts(userId: string) {
    return useQuery({
        queryKey: ["profile-posts", userId],
        queryFn: async () => {
            const data = await getPublicProfilePosts(userId, 'All');
            return data.posts.map(mapPublicPostToPost);
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}
