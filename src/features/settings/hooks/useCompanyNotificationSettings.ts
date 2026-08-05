"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from "@/services/api/settings";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useSocket } from "@/context/SocketContext";

export function useCompanyNotificationSettings() {
  const queryClient = useQueryClient();
  const { activeProfile, isCompany } = useActiveProfile();
  const { socket } = useSocket();
  
  const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;
  
  const queryKey = ["companyNotificationSettings", companyId];

  useEffect(() => {
    if (!socket || !companyId) return;

    const handleOrgNotifUpdate = (data: any) => {
      if (data?.orgId === companyId || data?.org_id === companyId) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    socket.on("ORGANIZATION_NOTIFICATIONS_UPDATED", handleOrgNotifUpdate);
    return () => {
      socket.off("ORGANIZATION_NOTIFICATIONS_UPDATED", handleOrgNotifUpdate);
    };
  }, [socket, companyId, queryClient, queryKey]);

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
