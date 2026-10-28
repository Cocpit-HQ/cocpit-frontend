'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/businessProfile';
import { useQueryClient } from '@tanstack/react-query';
import { EyeOff } from 'lucide-react';
import { useTeamRoles } from '@/features/org-team/hooks/useTeamRoles';

function formatRoleName(role: string): string {
  if (!role) return 'Member';
  return role
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export interface AccessiblePagePill {
  label: string;
  path: string;
  permission?: string;
  alwaysAvailable?: boolean;
}

export const DEFAULT_PAGES: AccessiblePagePill[] = [
  { label: 'Feed', path: '/feed', alwaysAvailable: true },
  { label: 'Profile', path: '/profile', alwaysAvailable: true },
  { label: 'Settings', path: '/settings', alwaysAvailable: true },
  { label: 'Chat', path: '/messaging', permission: 'CHAT' },
  { label: 'Jobs', path: '/jobs', permission: 'POST_JOBS' },
  { label: 'Team', path: '/team', permission: 'TEAMS' },
  { label: 'Analytics', path: '/company-analytics', permission: 'VIEW_ANALYTICS' },
];

// const ROLE_DESCRIPTIONS: Record<string, string> = {
//   MARKETING: 'Responsible for developing marketing strategies, creating campaigns, managing content, and tracking campaign performance.',
//   ADMIN: 'Full access to manage organization settings, members, roles, billing, and all features.',
//   OWNER: 'Full access and ultimate authority over organization settings, verification, roles, and ownership.',
//   RECRUITER: 'Responsible for posting jobs, managing candidates, viewing applicants, and recruiting talent.',
//   EDITOR: 'Authorized to create, edit, and publish content, articles, and posts for the organization.',
//   ANALYST: 'Access to view performance metrics, analytics reports, and organization data insights.',
//   MEMBER: 'Standard team member access to view shared channels, team directory, and public posts.',
//   VIEWER: 'Read-only access to view public organization details, feeds, and channels.',
// };

interface AccessDeniedProps {
  title?: string;
  message?: string;
  roleName?: string;
  roleDescription?: string;
  roleColor?: string;
  accessiblePages?: AccessiblePagePill[];
  showBackButton?: boolean;
}

export default function AccessDenied({
  title = "You don't have access to this screen",
  message = "Your current role doesn't include permission to view this page.",
  roleName,
  roleDescription,
  roleColor,
  accessiblePages,
}: AccessDeniedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProfile, refreshProfile, refreshCompanies } = useActiveProfile();
  const perms = useCompanyPermissions(activeProfile);

  const handleRefreshPermissions = React.useCallback(async () => {
    try {
      if (refreshProfile) await refreshProfile();
      if (refreshCompanies) await refreshCompanies();
      await queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['company'] });
      await queryClient.invalidateQueries({ queryKey: ['userCompanies'] });
    } catch (e) {
      console.warn('Failed to refresh permissions', e);
    }
  }, [refreshProfile, refreshCompanies, queryClient]);

  // Auto re-check permissions when returning to the tab
  React.useEffect(() => {
    const onFocus = () => {
      handleRefreshPermissions();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [handleRefreshPermissions]);

  const profileAny = activeProfile as any;

  // Fetch company roles as fallback to ensure the assigned role color is available
  const { roles } = useTeamRoles();

  // Determine current role name
  const rawRole =
    roleName ||
    profileAny?.viewer_role_data?.name ||
    perms?.role ||
    profileAny?.role ||
    'Member';
  const displayRoleName = formatRoleName(rawRole);

  const matchedRole = React.useMemo(() => {
    if (!roles || !Array.isArray(roles)) return null;
    return roles.find(
      (r: any) =>
        r.name?.toLowerCase() === rawRole?.toLowerCase()
    );
  }, [roles, rawRole]);

  // Determine role description
  const currentRoleDesc =
    roleDescription ||
    profileAny?.viewer_role_data?.description ||
    matchedRole?.description ||
    `Assigned to the ${displayRoleName} role within your organization.`;

  // Determine role indicator color
  const dotColor =
    roleColor ||
    profileAny?.viewer_role_data?.color ||
    profileAny?.role_color ||
    matchedRole?.color ||
    'var(--ds-accent)';

  // Determine accessible pages pills
  const pagesToDisplay = React.useMemo(() => {
    if (accessiblePages && accessiblePages.length > 0) {
      return accessiblePages;
    }

    const slug = (activeProfile as any)?.slug;
    
    const isCompany = activeProfile?.type === 'COMPANY';

    const dynamicPages: AccessiblePagePill[] = [
      { label: 'Feed', path: '/feed', alwaysAvailable: true },
      {
        label: 'Profile',
        path: isCompany && slug ? `/organization/${slug}` : '/profile',
        alwaysAvailable: true,
      },
      {
        label: 'Settings',
        path: isCompany && slug ? `/organization/${slug}/settings` : '/settings',
        alwaysAvailable: !isCompany,
        permission: 'SETTINGS',
      },
      { label: 'Chat', path: '/messaging', permission: 'CHAT' },
      { label: 'Jobs', path: '/jobs', permission: 'POST_JOBS' },
      { label: 'Team', path: isCompany && slug ? `/organization/${slug}/settings?tab=members` : '/team', permission: 'TEAMS' },
      {
        label: 'Analytics',
        path: isCompany && slug ? `/organization/${slug}/analytics` : '/company-analytics',
        permission: 'VIEW_ANALYTICS',
      },
    ];

    const seenPaths = new Set<string>();
    return dynamicPages.filter((p) => {
      if (!p.alwaysAvailable && p.permission && !perms.checkPermission(p.permission)) {
        return false;
      }
      if (seenPaths.has(p.path)) {
        return false;
      }
      seenPaths.add(p.path);
      return true;
    });
  }, [accessiblePages, perms, activeProfile]);

  // Prevent AccessDenied screen from briefly flashing during company deactivation or deletion
  if (
    typeof window !== 'undefined' &&
    ((window as any).__cocpit_is_deactivating ||
      (window as any).__cocpit_is_deleting ||
      sessionStorage.getItem('cocpit_is_deactivating') === 'true' ||
      sessionStorage.getItem('cocpit_is_deleting') === 'true')
  ) {
    return null;
  }

  return (
    <div className="access-denied-page fixed inset-0 left-0 sm:left-[220px] sm:pr-[220px] z-20 overflow-y-auto bg-ds-bg flex flex-col">
      <div className="w-full my-auto flex flex-col items-center justify-center py-10 px-4 pb-20 sm:pb-10">
        {/* Orange Eye-Off Icon (40x40px) */}
        <div className="mb-4 text-ds-accent flex items-center justify-center">
          <EyeOff className="w-[40px] h-[40px] text-ds-accent" strokeWidth={1.75} />
        </div>

        {/* Heading & Message (Main body: 16px / 24px regular, #FFECE6) */}
        <h1 className="text-[16px] font-normal leading-[24px] text-ds-text-primary text-center font-['DM_Sans',sans-serif] mb-1">
          {title}
        </h1>
        <p className="text-[14px] leading-[20px] text-ds-text-secondary text-center font-['DM_Sans',sans-serif] max-w-[460px] mb-8">
          {message}
        </p>

        {/* Main Content Container */}
        <div className="w-full max-w-[460px] space-y-6">
          {/* Current Role Card */}
          <div>
            <h2 className="text-[12px] font-normal leading-[16px] text-ds-text-secondary mb-2 font-['DM_Sans',sans-serif]">
              Current role
            </h2>
            <div className="bg-transparent border border-ds-border rounded-xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-[6px] h-[6px] rounded-full shrink-0 inline-block"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="text-[16px] font-medium leading-[24px] text-ds-text-primary font-['DM_Sans',sans-serif]">
                  {displayRoleName}
                </span>
              </div>
              <p className="text-[14px] leading-[22px] text-ds-text-secondary font-['DM_Sans',sans-serif]">
                {currentRoleDesc}
              </p>
            </div>
          </div>

          {/* Pages You Can Access Section */}
          <div>
            <h2 className="text-[12px] font-normal leading-[16px] text-ds-text-secondary mb-3 font-['DM_Sans',sans-serif]">
              Pages you can access
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {pagesToDisplay.map((page) => (
                <button
                  key={page.label}
                  type="button"
                  onClick={() => router.push(page.path)}
                  className="h-[28px] px-3.5 rounded-full bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-accent text-[12px] font-medium font-['DM_Sans',sans-serif] transition-colors duration-[120ms] focus:outline-none focus-visible:ring-1 focus-visible:ring-ds-accent cursor-pointer select-none inline-flex items-center justify-center"
                >
                  {page.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
