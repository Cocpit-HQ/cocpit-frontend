'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/companyprofile/hooks/useCompanyPermissions';
import { useQueryClient } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import './access-denied.css';

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
  { label: 'Chat queries', path: '/channel', alwaysAvailable: true },
  { label: 'Jobs', path: '/jobs', permission: 'POST_JOBS' },
  { label: 'Team', path: '/team', permission: 'TEAMS' },
  { label: 'Analytics', path: '/company-analytics', permission: 'VIEW_ANALYTICS' },
];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  MARKETING: 'Responsible for developing marketing strategies, creating campaigns, managing content, and tracking campaign performance.',
  ADMIN: 'Full access to manage organization settings, members, roles, billing, and all features.',
  OWNER: 'Full access and ultimate authority over organization settings, verification, roles, and ownership.',
  RECRUITER: 'Responsible for posting jobs, managing candidates, viewing applicants, and recruiting talent.',
  EDITOR: 'Authorized to create, edit, and publish content, articles, and posts for the organization.',
  ANALYST: 'Access to view performance metrics, analytics reports, and organization data insights.',
  MEMBER: 'Standard team member access to view shared channels, team directory, and public posts.',
  VIEWER: 'Read-only access to view public organization details, feeds, and channels.',
};

interface AccessDeniedProps {
  title?: string;
  message?: string;
  roleName?: string;
  roleDescription?: string;
  accessiblePages?: AccessiblePagePill[];
  showBackButton?: boolean;
}

export default function AccessDenied({
  title = "You don't have access to this page",
  message = "Your current role doesn't include permission to view this page.",
  roleName,
  roleDescription,
  accessiblePages,
}: AccessDeniedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProfile, refreshProfile, refreshCompanies } = useActiveProfile();
  const perms = useCompanyPermissions(activeProfile);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefreshPermissions = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (refreshProfile) await refreshProfile();
      if (refreshCompanies) await refreshCompanies();
      await queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['company'] });
      await queryClient.invalidateQueries({ queryKey: ['userCompanies'] });
    } catch (e) {
      console.warn('Failed to refresh permissions', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
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

  // Determine user avatar URL
  const avatarUrl =
    profileAny?.avatar_url ||
    profileAny?.avatar ||
    profileAny?.logo_url ||
    '/assets/pngegg.png';

  // Determine current role name
  const currentRole =
    roleName ||
    profileAny?.viewer_role_data?.name ||
    perms?.role ||
    profileAny?.role ||
    'Member';

  // Determine role description
  const upperRoleKey = currentRole.toUpperCase();
  const currentRoleDesc =
    roleDescription ||
    profileAny?.viewer_role_data?.description ||
    ROLE_DESCRIPTIONS[upperRoleKey] ||
    `Assigned to the ${currentRole} role within your organization.`;

  // Determine accessible pages pills
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
      { label: 'Job chat', path: '/messaging', permission: 'JOBS_CHAT' },
      { label: 'Channel', path: '/channel', permission: 'CHANNELS' },
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

  return (
    <div className="access-denied-page min-h-[70vh] flex flex-col items-center justify-center py-10 px-4">
      {/* User Avatar Badge Speech Bubble */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <img
            src={avatarUrl}
            alt={activeProfile?.name || 'User Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/pngegg.png';
            }}
          />
        </div>
        {/* Speech Bubble Tail Indicator */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-800 rotate-45 border-r border-b border-zinc-200 dark:border-zinc-700" />
      </div>

      {/* Lock Icon with Slash */}
      <div className="mb-4 text-[#1A73E8] dark:text-[#60A5FA]">
        <svg
          className="w-12 h-12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Lock Body */}
          <rect x="5" y="11" width="14" height="10" rx="2" />
          {/* Lock Shackle */}
          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          {/* Diagonal Slash */}
          <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2" />
        </svg>
      </div>

      {/* Heading & Message */}
      <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center font-['Poppins'] mb-1.5">
        {title}
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center font-['Poppins'] max-w-md mb-4">
        {message}
      </p>

      {/* Dynamic Refresh Permissions Button */}
      <button
        onClick={handleRefreshPermissions}
        disabled={isRefreshing}
        className="mb-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 font-['Poppins'] transition-all disabled:opacity-50"
      >
        <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1A73E8]' : ''}`} />
        <span>{isRefreshing ? 'Checking permissions...' : 'Refresh permissions'}</span>
      </button>

      {/* Main Content Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Current Role Card */}
        <div>
          <h3 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 font-['Poppins']">
            Current role
          </h3>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8] inline-block" />
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-['Poppins']">
                {currentRole}
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-['Poppins'] leading-relaxed pl-4">
              {currentRoleDesc}
            </p>
          </div>
        </div>

        {/* Pages You Can Access Section */}
        <div>
          <h3 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 font-['Poppins']">
            Pages you can access
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {pagesToDisplay.map((page) => (
              <button
                key={page.label}
                onClick={() => router.push(page.path)}
                className="px-4 py-1.5 rounded-full bg-[#E8F0FE] dark:bg-zinc-800 text-[#1A73E8] dark:text-[#60A5FA] hover:bg-[#D2E3FC] dark:hover:bg-zinc-700 text-xs md:text-sm font-medium font-['Poppins'] transition-colors"
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
