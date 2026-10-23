import { useActiveProfile } from "@/context/ActiveProfileContext";

export const NO_FOLLOW_ACCESS_MESSAGE = "You don't have access to follow/unfollow on the behalf of company";

export function useCompanyFollowPermission() {
  const { activeProfile, isCompany } = useActiveProfile();
  const isCompanyActor = Boolean(isCompany || activeProfile?.type === "COMPANY");

  const actingCompanyRole = activeProfile?.viewer_role_data;
  const actingCompanyCanFollow =
    !isCompanyActor ||
    Boolean(actingCompanyRole?.is_owner) ||
    Boolean(actingCompanyRole?.permissions?.includes("*")) ||
    Boolean(actingCompanyRole?.permissions?.includes("MANAGE_COMMUNITY")) ||
    Boolean(actingCompanyRole?.permissions?.includes("MANAGE_COMPANY_DETAILS"));

  return {
    isCompanyActor,
    canFollow: actingCompanyCanFollow,
    message: NO_FOLLOW_ACCESS_MESSAGE,
  };
}
