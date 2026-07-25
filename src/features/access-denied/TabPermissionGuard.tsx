'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/companyprofile/hooks/useCompanyPermissions';
import AccessDenied from './AccessDenied';

interface TabPermissionGuardProps {
  /** Explicit active tab name (optional; if omitted, reads `?tab=` from searchParams) */
  activeTab?: string;
  /** Explicit permission override for the tab */
  permission?: string;
  children: React.ReactNode;
}

/** Mapping of organization tabs to required permission keys */
const TAB_PERMISSION_MAP: Record<string, string | string[]> = {
  jobs: ['POST_JOBS', 'JOBS', 'VIEW_APPLICANTS'],
  analytics: ['VIEW_ANALYTICS', 'ANALYTICS'],
  members: ['TEAMS', 'MANAGE_MEMBERS', 'INVITE_MEMBERS'],
  settings: ['MANAGE_COMPANY_DETAILS'],
  channel: ['CHANNEL', 'CHANNELS'],
  team: ['TEAMS', 'MANAGE_MEMBERS'],
};

export default function TabPermissionGuard({
  activeTab,
  permission,
  children,
}: TabPermissionGuardProps) {
  const searchParams = useSearchParams();
  const { activeProfile, isCompany, isLoading } = useActiveProfile();
  const { checkPermission } = useCompanyPermissions(activeProfile);

  // If loading or personal profile, render children
  if (isLoading || !isCompany) {
    return <>{children}</>;
  }

  // Determine current tab
  const currentTab = (activeTab || searchParams.get('tab') || 'home').toLowerCase();

  // Determine required permissions
  let requiredPermissions = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : TAB_PERMISSION_MAP[currentTab];

  if (!requiredPermissions) {
    // Tab has no special permission requirement (e.g., home, about, posts, alumni, people)
    return <>{children}</>;
  }

  const permsArray = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  const hasPermission = permsArray.some((p) => checkPermission(p));

  if (!hasPermission) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
