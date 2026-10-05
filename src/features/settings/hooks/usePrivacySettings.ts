import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPrivacySettings, updatePrivacySettings, PrivacySettings } from "@/services/api/settings";
import { toast } from "sonner";

export const PRIVACY_SETTINGS_QUERY_KEY = ["privacySettings"];

export function usePrivacySettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PRIVACY_SETTINGS_QUERY_KEY,
    queryFn: () => getPrivacySettings(),
  });

  const mutation = useMutation({
    mutationFn: (newSettings: Partial<PrivacySettings>) => updatePrivacySettings(newSettings),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: PRIVACY_SETTINGS_QUERY_KEY });
      const previousSettings = queryClient.getQueryData<PrivacySettings>(PRIVACY_SETTINGS_QUERY_KEY);
      
      if (previousSettings) {
        queryClient.setQueryData<PrivacySettings>(PRIVACY_SETTINGS_QUERY_KEY, {
          ...previousSettings,
          ...newSettings,
        });
      }

      return { previousSettings };
    },
    onError: (err: any, newSettings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(PRIVACY_SETTINGS_QUERY_KEY, context.previousSettings);
      }
      toast.error("Failed to update privacy settings");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PRIVACY_SETTINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
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
