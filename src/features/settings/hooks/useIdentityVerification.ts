import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyIdentity } from "@/services/api/settings";
import { toast } from "sonner";
import { useActiveProfile } from "@/context/ActiveProfileContext";

export function useIdentityVerification() {
  const queryClient = useQueryClient();
  const { isCompany, activeProfile, refreshProfile } = useActiveProfile();

  return useMutation({
    mutationFn: async (data: { documentType: string; frontImage: File; backImage?: File }) => {
      const formData = new FormData();
      formData.append("documentType", data.documentType);
      formData.append("frontImage", data.frontImage);
      if (data.backImage) {
        formData.append("backImage", data.backImage);
      }

      const companyId = isCompany ? activeProfile?.id : undefined;
      return await verifyIdentity(formData, companyId);
    },
    onSuccess: async () => {
      toast.success("Identity verification submitted successfully");
      
      if (isCompany) {
        queryClient.invalidateQueries({ queryKey: ["company", activeProfile?.id] });
        queryClient.invalidateQueries({ queryKey: ["activeProfile"] });
      } else {
        queryClient.setQueryData(["my-profile"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            user: {
              ...old.user,
              is_identity_verified: true,
              verification_status: "VERIFIED",
            },
          };
        });
        queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        queryClient.invalidateQueries({ queryKey: ["activeProfile"] });
      }

      try {
        if (refreshProfile) {
          await refreshProfile();
        }
      } catch (err) {
        console.error("Failed to refresh profile:", err);
      }
    },
    onError: (error: any) => {
      console.error("Verification error:", error);
      toast.error(error.response?.data?.message || "Failed to verify identity");
    },
  });
}
