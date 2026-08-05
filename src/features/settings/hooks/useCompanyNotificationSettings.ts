"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from "@/services/api/settings";
import { useActiveProfile } from "@/context/ActiveProfileContext";

export function useCompanyNotificationSettings() {
  const queryClient = useQueryClient();
  const { activeProfile, isCompany } = useActiveProfile();
  
  const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;
  
  const queryKey = ["companyNotificationSettings", companyId];

  const { data: settings, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getNotificationPreferences(companyId),
    enabled: !!companyId,
  });

  const mutation = useMutation({
    mutationFn: (partial: Partial<NotificationPreferences>) => updateNotificationPreferences(partial, companyId),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSettings = queryClient.getQueryData<NotificationPreferences>(queryKey);

      if (previousSettings) {
        queryClient.setQueryData<NotificationPreferences>(queryKey, {
          ...previousSettings,
          ...newSettings,
        });
      }

      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKey, context.previousSettings);
      }
      toast.error("Failed to update notification settings");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateSettings = useCallback(
    (partial: Partial<NotificationPreferences>) => {
      mutation.mutate(partial);
    },
    [mutation]
  );

  return {
    settings,
    isLoading,
    isError,
    updateSettings,
    isUpdating: mutation.isPending,
  };
}
