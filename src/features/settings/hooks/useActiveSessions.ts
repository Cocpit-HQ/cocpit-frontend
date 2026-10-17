import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActiveSessions, logoutSession, logoutOtherSessions, ActiveSession } from "@/services/api/settings";
import { toast } from "sonner";

export const ACTIVE_SESSIONS_QUERY_KEY = ["activeSessions"];

export function useActiveSessions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ACTIVE_SESSIONS_QUERY_KEY,
    queryFn: getActiveSessions,
  });

  const logoutMutation = useMutation({
    mutationFn: (id: string | number) => logoutSession(id),
    onSuccess: () => {
      toast.success("Session logged out successfully");
      queryClient.invalidateQueries({ queryKey: ACTIVE_SESSIONS_QUERY_KEY });
    },
    onError: () => {
      toast.error("Failed to log out session");
    }
  });

  const logoutOtherMutation = useMutation({
    mutationFn: () => logoutOtherSessions(),
    onSuccess: () => {
      toast.success("All other sessions logged out successfully");
      queryClient.invalidateQueries({ queryKey: ACTIVE_SESSIONS_QUERY_KEY });
    },
    onError: () => {
      toast.error("Failed to log out other sessions");
    }
  });

  return {
    sessions: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    logoutSession: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    logoutOtherSessions: logoutOtherMutation.mutate,
    isLoggingOutOthers: logoutOtherMutation.isPending,
  };
}
