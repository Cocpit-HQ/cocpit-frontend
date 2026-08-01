import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from "@/services/api/settings";
import { toast } from "sonner";

export const NOTIFICATION_SETTINGS_QUERY_KEY = ["notificationSettings"];

export function useNotificationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATION_SETTINGS_QUERY_KEY,
    queryFn: getNotificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: (newPrefs: NotificationPreferences) => updateNotificationPreferences(newPrefs),
    onMutate: async (newPrefs) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_SETTINGS_QUERY_KEY });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<NotificationPreferences>(NOTIFICATION_SETTINGS_QUERY_KEY);

      // Optimistically update to the new value
      queryClient.setQueryData<NotificationPreferences>(NOTIFICATION_SETTINGS_QUERY_KEY, newPrefs);

      return { previousSettings };
    },
    onError: (err, newPrefs, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSettings) {
        queryClient.setQueryData(NOTIFICATION_SETTINGS_QUERY_KEY, context.previousSettings);
      }
      toast.error("Failed to update notification settings");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_SETTINGS_QUERY_KEY });
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateSettings: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
