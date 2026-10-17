import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSavedFolders, createSavedFolder } from "@/features/settings/api/savedPost";
import { SavedFolder } from "@/types/entities";
import { toast } from "sonner";

export const SAVED_FOLDERS_QUERY_KEY = ["saved-folders"];

export function useSavedFolders() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: SAVED_FOLDERS_QUERY_KEY,
    queryFn: () => getSavedFolders(),
  });

  const { mutate: createFolder, isPending: isCreating } = useMutation({
    mutationFn: (params: { name: string; coverImage?: string }) =>
      createSavedFolder(params.name, undefined, params.coverImage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_FOLDERS_QUERY_KEY });
      toast.success("Collection created successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create collection");
    },
  });

  return {
    folders: data?.folders || [],
    isLoading,
    error,
    createFolder,
    isCreating,
  };
}
