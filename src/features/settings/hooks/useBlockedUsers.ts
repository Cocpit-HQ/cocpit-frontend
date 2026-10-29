import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlockedUsers, unblockUser as unblockUserRequest } from "@/features/settings/api/blocked";
import { toast } from "sonner";
import { formatDistanceToNowStrict, differenceInHours } from "date-fns";
import { useActiveProfile } from "@/context/ActiveProfileContext";

export interface BlockedUser {
  id: number | string;
  name: string;
  date: string;
  avatar: string;
  slug?: string;
  account_name?: string;
  isCompany?: boolean;
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
  slug: u.slug || u.account_name || u.username || String(u.id || u.user_id),
  account_name: u.account_name || u.slug || u.username,
  date: u.date || (u.created_at ? formatBlockTime(u.created_at) : "Blocked recently"),
  avatar: u.avatar || u.avatar_url || "",
  isCompany: u.type === 'company' || u.isCompany === true,
});

export function useBlockedUsers() {
  const queryClient = useQueryClient();
  const { isCompany } = useActiveProfile();

  const query = useQuery({
    queryKey: BLOCKED_USERS_QUERY_KEY,
    queryFn: async () => {
      const users = await getBlockedUsers();
      return (users || [])
        .filter((u: any) => {
          const name = u?.name || u?.full_name || u?.username;
          return Boolean(u && (u.id || u.user_id) && name && name !== 'Unknown User' && name !== 'Blocked Account');
        })
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
    onError: (err: any, id, context) => {
      if (context?.previous) queryClient.setQueryData(BLOCKED_USERS_QUERY_KEY, context.previous);
      toast.error(err?.response?.data?.message || (isCompany ? "Failed to unblock account" : "Failed to unblock user"));
    },
    onSuccess: (data: any, id) => {
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

      const successMsg = data?.message || (isCompany ? "Account unblocked for company" : "User unblocked successfully");
      toast.success(successMsg);
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
