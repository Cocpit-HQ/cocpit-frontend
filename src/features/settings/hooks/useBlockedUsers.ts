import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlockedUsers, unblockUser as unblockUserRequest } from "@/features/settings/api/blocked";
import { toast } from "sonner";

export interface BlockedUser {
  id: number | string;
  name: string;
  date: string;
  avatar: string;
}

export const BLOCKED_USERS_QUERY_KEY = ["blockedUsers"];

// Backend returns loosely-typed rows; normalize once here instead of in the page.
const mapBlockedUser = (u: any): BlockedUser => ({
  id: u.id || u.user_id,
  name: u.name || u.full_name || u.username || "Unknown User",
  date: u.date || (u.created_at ? `Blocked ${new Date(u.created_at).toLocaleDateString()}` : "Blocked recently"),
  avatar: u.avatar || u.avatar_url || "",
});

export function useBlockedUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: BLOCKED_USERS_QUERY_KEY,
    queryFn: async () => {
      const users = await getBlockedUsers();
      return users.map(mapBlockedUser);
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (id: number | string) => unblockUserRequest(id),
    onMutate: async (id) => {
      // Optimistically drop the row so the "Unblock" click feels instant.
      await queryClient.cancelQueries({ queryKey: BLOCKED_USERS_QUERY_KEY });
      const previous = queryClient.getQueryData<BlockedUser[]>(BLOCKED_USERS_QUERY_KEY);
      queryClient.setQueryData<BlockedUser[]>(BLOCKED_USERS_QUERY_KEY, (prev) =>
        (prev || []).filter((u) => u.id !== id)
      );
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) queryClient.setQueryData(BLOCKED_USERS_QUERY_KEY, context.previous);
      toast.error("Failed to unblock user");
    },
    onSuccess: () => {
      toast.success("User unblocked successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_QUERY_KEY });
    },
  });

  return {
    blockedUsers: query.data || [],
    isLoading: query.isLoading,
    unblockUser: unblockMutation.mutate,
    isUnblocking: unblockMutation.isPending,
  };
}
