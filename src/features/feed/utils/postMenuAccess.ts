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
  authorId?: string | null;
  currentUserId?: string | null;
  /** Pass permissions directly when already loaded (e.g. the company's own profile response). */
  explicitPermissions?: string[] | null;
  /** Otherwise, the viewer's full company membership list (e.g. ActiveProfileContext's userCompanies). */
  userCompanies?: CompanyMembershipLike[];
  /** Optional activeProfile context. If provided and isCompanyPost is true, it enforces that the user must be acting as that company. */
  activeProfile?: { type: string, id: string } | null;
}

// ===========================================================================
// [SCRUM-1367] Replaced legacy hasFullAccess:
// Previously, post edit/delete permissions were coupled with Profile Management
// (MANAGE_COMPANY_DETAILS, MANAGE_COMPANY).
// Per SCRUM-1367, edit and delete permissions are now controlled exclusively
// by Post Interactions (CREATE_POST / CREATE_CONTENT / MANAGE_CONTENT / *).
//
// Legacy code kept for reference:
// function hasFullAccess(perms: string[]): boolean {
//   return (
//     perms.includes('*') ||
//     perms.includes('MANAGE_COMPANY_DETAILS') ||
//     perms.includes('MANAGE_ORGANIZATION_DETAILS') ||
//     perms.includes('MANAGE_COMPANY') ||
//     perms.includes('MANAGE_ORGANIZATION') ||
//     perms.includes('MANAGE_CONTENT')
//   );
// }
// ===========================================================================
function hasPostInteractionsAccess(perms: string[]): boolean {
  return (
    perms.includes('*') ||
    perms.includes('CREATE_POST') ||
    perms.includes('CREATE_CONTENT') ||
    perms.includes('MANAGE_CONTENT')
  );
}

export function getPostMenuAccess(params: GetPostMenuAccessParams): PostMenuAccess {
  const { isCompanyPost, companyId, createdByUserId, authorId, currentUserId, activeProfile } = params;

  if (!isCompanyPost) {
    if (!currentUserId) return 'outsider';

    // If the active profile is a COMPANY, they are an outsider to personal user posts.
    if (activeProfile?.type === 'COMPANY') {
      return 'outsider';
    }

    const effectiveAuthorId = createdByUserId || authorId;
    return (effectiveAuthorId && String(effectiveAuthorId).toLowerCase() === String(currentUserId).toLowerCase()) ? 'owner' : 'outsider';
  }

  // Enforce that the user must be acting as this exact company.
  // If no profile is active, or they are acting as a USER, or as a DIFFERENT company, treat them as an outsider.
  if (!activeProfile || activeProfile.type !== 'COMPANY' || String(activeProfile.id).toLowerCase() !== String(companyId).toLowerCase()) {
    return 'outsider';
  }

  const company = params.userCompanies?.find(
    (c) => String(c.org_id || c.company_id).toLowerCase() === String(companyId).toLowerCase()
  );

  // Admin/Owner can manage any of their company's posts
  const isOrgCreator = Boolean(company && company.created_by && String(company.created_by).toLowerCase() === String(currentUserId).toLowerCase());
  const isOwnerFlag = Boolean(
    (company?.viewer_role_data as any)?.is_owner ||
    (params.activeProfile && String(params.activeProfile.id).toLowerCase() === String(companyId).toLowerCase() && (params.activeProfile as any)?.viewer_role_data?.is_owner)
  );
  const roleName = String(
    (company?.viewer_role_data as any)?.name ||
    (params.activeProfile && String(params.activeProfile.id).toLowerCase() === String(companyId).toLowerCase() ? (params.activeProfile as any)?.viewer_role_data?.name : '') ||
    (company as any)?.role ||
    ''
  ).toUpperCase();
  const isAdminOrOwnerRole = roleName === 'ADMIN' || roleName === 'OWNER';

  if (isOrgCreator || isOwnerFlag || isAdminOrOwnerRole) return 'owner';

  const rawPerms =
    params.explicitPermissions ??
    company?.viewer_role_data?.permissions ??
    (params.activeProfile && String(params.activeProfile.id).toLowerCase() === String(companyId).toLowerCase() ? (params.activeProfile as any)?.viewer_role_data?.permissions : null) ??
    null;

  if (!rawPerms || rawPerms.length === 0) return 'outsider'; // not a member of this company

  const perms = rawPerms.map((p: any) => String(p).toUpperCase().trim());

  // ===========================================================================
  // [SCRUM-1367]
  // Previously:
  // 1. if (hasFullAccess(perms)) return 'owner';
  // 2. if (!currentUserId) return 'internal';
  // 3. const isAuthor = Boolean(
  //      createdByUserId &&
  //      String(companyId).toLowerCase() !== String(createdByUserId).toLowerCase() &&
  //      String(createdByUserId).toLowerCase() === String(currentUserId).toLowerCase()
  //    );
  //    if (isAuthor) return 'owner';
  //
  // Reason for update:
  // Previously, an author could edit/delete company posts even if their role
  // had Post Interactions disabled, and Profile Management erroneously granted edit/delete.
  // Now: Ability to edit or delete company posts is controlled strictly by Post Interactions.
  // When enabled, members can edit/delete company posts. When disabled, they cannot.
  // ===========================================================================
  if (hasPostInteractionsAccess(perms)) return 'owner';

  return 'internal';
}
