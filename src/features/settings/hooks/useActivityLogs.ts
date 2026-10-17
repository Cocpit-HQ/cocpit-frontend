import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActivityLogs, removeActivity } from "@/features/settings/api/activity";
import { feedApi } from "@/features/feed/api/feed.api";
import { toast } from "sonner";
import type { ActivityTab } from "@/store/settings.store";

const LOG_TYPE: Record<ActivityTab, "likes" | "comments" | "tags"> = {
  Likes: "likes",
  Comments: "comments",
  Tags: "tags",
};

const REMOVE_TYPE: Record<ActivityTab, "like" | "comment" | "tag"> = {
  Likes: "like",
  Comments: "comment",
  Tags: "tag",
};

// `tab` is the "tab parameter" referenced in settings.store.ts: it comes
// from useSettingsStore (UI state) and is threaded into the queryKey here
// so switching pills is a TanStack Query cache lookup/fetch, not a manual
// useEffect + setState dance.
export const activityLogsQueryKey = (tab: ActivityTab, companyId?: string) => ["activityLogs", tab, companyId || "me"] as const;

export function useActivityLogs(tab: ActivityTab, companyId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: activityLogsQueryKey(tab, companyId),
    queryFn: () => getActivityLogs(LOG_TYPE[tab], companyId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const removeMutation = useMutation({
    mutationFn: async (params: { id: number | string; postId?: string }) => {
      // "Likes" removal goes through the feed's like-toggle endpoint, not
      // the generic activity-removal endpoint the other two tabs use.
      if (tab === "Likes") {
        await feedApi.toggleLike(params.id as string, companyId);
      } else {
        await removeActivity(REMOVE_TYPE[tab], params.id, companyId, params.postId);
      }
      return params.id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<any[]>(activityLogsQueryKey(tab, companyId), (prev) =>
        (prev || []).filter((item) => item.id !== id)
      );
      toast.success("Activity removed");
    },
    onError: () => {
      toast.error("Failed to remove activity");
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    removeActivity: removeMutation.mutate,
  };
}
