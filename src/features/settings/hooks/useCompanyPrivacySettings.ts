"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPrivacySettings, updatePrivacySettings, PrivacySettings } from "@/services/api/settings";
import { useActiveProfile } from "@/context/ActiveProfileContext";

export function useCompanyPrivacySettings() {
  const queryClient = useQueryClient();
  const { activeProfile, isCompany } = useActiveProfile();
  
  const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;
  
  const queryKey = ["companyPrivacySettings", companyId];

  const { data: settings, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getPrivacySettings(companyId),
    enabled: !!companyId, // Only fetch if we have a company ID
  });

  const mutation = useMutation({
    mutationFn: (partial: Partial<PrivacySettings>) => updatePrivacySettings(partial, companyId),
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<PrivacySettings>(queryKey);

      // Optimistically update to the new value
      if (previousSettings) {
        queryClient.setQueryData<PrivacySettings>(queryKey, {
          ...previousSettings,
          ...newSettings,
        });
      }

      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      // Return to previous state if error
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKey, context.previousSettings);
      }
      toast.error("Failed to update privacy settings");
    },
    onSettled: () => {
      // Sync with server once mutation has finished
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.invalidateQueries({ queryKey: ["orgProfile"] });
    },
  });

  const updateSettings = useCallback(
    (partial: Partial<PrivacySettings>) => {
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
