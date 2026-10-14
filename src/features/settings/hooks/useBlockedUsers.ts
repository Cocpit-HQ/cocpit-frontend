import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlockedUsers, unblockUser as unblockUserRequest } from "@/features/settings/api/blocked";
import { toast } from "sonner";
import { formatDistanceToNowStrict, differenceInHours } from "date-fns";

export interface BlockedUser {
  id: number | string;
  name: string;
  date: string;
  avatar: string;
}

export const BLOCKED_USERS_QUERY_KEY = ["blockedUsers"];

const formatBlockTime = (dateString?: string) => {
  if (!dateString) return "Blocked recently";
  try {
    const date = new Date(dateString);
    if (differenceInHours(new Date(), date) < 1) {
      return "Blocked just now";
    }
    return `Blocked ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
  } catch (e) {
    return "Blocked recently";
  }
};

// Backend returns loosely-typed rows; normalize once here instead of in the page.
const mapBlockedUser = (u: any): BlockedUser => ({
  id: u.id || u.user_id,
  name: u.name || u.full_name || u.username || "Unknown User",
  date: u.date || (u.created_at ? formatBlockTime(u.created_at) : "Blocked recently"),
  avatar: u.avatar || u.avatar_url || "",
});

export function useBlockedUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: BLOCKED_USERS_QUERY_KEY,
    queryFn: async () => {
      const users = await getBlockedUsers();
      return (users || [])
        .filter((u: any) => Boolean(u && (u.id || u.user_id) && u.name && u.name !== 'Unknown User' && u.name !== 'Blocked Account'))
        .map(mapBlockedUser);
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
    onSuccess: (_, id) => {
      const targetId = String(id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cocpit:block_status_changed", {
            detail: { targetId, isBlocked: false },
          })
        );
        try {
          localStorage.setItem(
            "cocpit_block_event",
            JSON.stringify({ targetId, isBlocked: false, timestamp: Date.now() })
          );
        } catch (e) {}
      }

      queryClient.removeQueries({ queryKey: ["profile", targetId] });
      queryClient.removeQueries({ queryKey: ["companyProfile", targetId] });
      queryClient.removeQueries({ queryKey: ["publicProfile", targetId] });
      queryClient.removeQueries({ queryKey: ["profileStats", targetId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
      queryClient.invalidateQueries({ queryKey: ["publicProfile"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });

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
