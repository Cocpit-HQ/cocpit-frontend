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
}

function hasFullAccess(perms: string[]): boolean {
  return perms.includes('*') || perms.includes('MANAGE_COMPANY_DETAILS');
}

export function getPostMenuAccess(params: GetPostMenuAccessParams): PostMenuAccess {
  const { isCompanyPost, companyId, createdByUserId, currentUserId } = params;

  if (!isCompanyPost) {
    if (!currentUserId) return 'outsider';
    return String(createdByUserId) === String(currentUserId) ? 'owner' : 'outsider';
  }

  const rawPerms =
    params.explicitPermissions ??
    params.userCompanies?.find(
      (c) => String(c.org_id || c.company_id) === String(companyId)
    )?.viewer_role_data?.permissions ??
    null;

  if (!rawPerms || rawPerms.length === 0) return 'outsider'; // not a member of this company

  const perms = rawPerms.map((p) => String(p).toUpperCase().trim());

  // Admin/Owner can manage any of their company's posts, independent of who's logged in as what.
  if (hasFullAccess(perms)) return 'owner';

  if (!currentUserId) return 'internal';

  const hasCreatePost = perms.includes('CREATE_POST');
  if (hasCreatePost && createdByUserId && String(createdByUserId) === String(currentUserId)) {
    return 'owner';
  }

  return 'internal';
}
