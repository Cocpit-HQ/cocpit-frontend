/**
 * Determines what three-dot menu (if any) a viewer should see on a post.
 *
 * - 'owner': viewer can Edit/Delete this post (post author with CREATE_POST,
 *   or a company Admin/Owner managing any of their company's posts).
 * - 'internal': viewer is a member of the posting company but has neither
 *   authored this post with posting rights nor admin/owner access — the
 *   menu should not render at all (Follow/Report/Not Interested don't make
 *   sense for an insider viewing their own company's content).
 * - 'outsider': viewer is not a member of the posting company (or the post
 *   is a personal post they didn't author) — show the normal viewer menu.
 */
export type PostMenuAccess = 'owner' | 'internal' | 'outsider';

export interface CompanyMembershipLike {
  org_id?: string;
  company_id?: string;
  viewer_role_data?: { permissions?: string[] | null } | null;
  created_by?: string;
}

export interface GetPostMenuAccessParams {
  isCompanyPost?: boolean;
  companyId?: string | null;
  createdByUserId?: string | null;
  currentUserId?: string | null;
  /** Pass permissions directly when already loaded (e.g. the company's own profile response). */
  explicitPermissions?: string[] | null;
  /** Otherwise, the viewer's full company membership list (e.g. ActiveProfileContext's userCompanies). */
  userCompanies?: CompanyMembershipLike[];
  /** Optional activeProfile context. If provided and isCompanyPost is true, it enforces that the user must be acting as that company. */
  activeProfile?: { type: string, id: string } | null;
}

function hasFullAccess(perms: string[]): boolean {
  return perms.includes('*') || perms.includes('MANAGE_COMPANY_DETAILS');
}

export function getPostMenuAccess(params: GetPostMenuAccessParams): PostMenuAccess {
  const { isCompanyPost, companyId, createdByUserId, currentUserId, activeProfile } = params;

  if (!isCompanyPost) {
    if (!currentUserId) return 'outsider';

    // If the active profile is a COMPANY, they are an outsider to personal user posts.
    if (activeProfile?.type === 'COMPANY') {
      return 'outsider';
    }

    return String(createdByUserId) === String(currentUserId) ? 'owner' : 'outsider';
  }

  // If activeProfile is provided, enforce that the user must be acting as this exact company.
  // If they are acting as a USER, or as a DIFFERENT company, treat them as a normal user (outsider).
  if (activeProfile && (activeProfile.type !== 'COMPANY' || String(activeProfile.id) !== String(companyId))) {
    return 'outsider';
  }

  const company = params.userCompanies?.find(
    (c) => String(c.org_id || c.company_id) === String(companyId)
  );

  // Admin/Owner can manage any of their company's posts, independent of who's logged in as what.
  const isCreator = Boolean(company && company.created_by && String(company.created_by) === String(currentUserId));
  if (isCreator) return 'owner';

  const rawPerms =
    params.explicitPermissions ??
    company?.viewer_role_data?.permissions ??
    null;

  if (!rawPerms || rawPerms.length === 0) return 'outsider'; // not a member of this company

  const perms = rawPerms.map((p) => String(p).toUpperCase().trim());

  if (hasFullAccess(perms)) return 'owner';

  if (!currentUserId) return 'internal';

  const hasCreatePost = perms.includes('CREATE_POST');
  if (hasCreatePost && createdByUserId && String(createdByUserId) === String(currentUserId)) {
    return 'owner';
  }

  return 'internal';
}
