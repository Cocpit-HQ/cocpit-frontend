'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/businessProfile';
import AccessDenied from './AccessDenied';

interface TabPermissionGuardProps {
  /** Explicit active tab name (optional; if omitted, reads `?tab=` from searchParams) */
  activeTab?: string;
  /** Explicit permission override for the tab */
  permission?: string | string[];
  viewerPermissions?: string[];
  canManageCompany?: boolean;
  isOwnProfile?: boolean;
  children: React.ReactNode;
}

/** Mapping of organization tabs to required permission keys */
const TAB_PERMISSION_MAP: Record<string, string | string[]> = {
  analytics: ['VIEW_ANALYTICS', 'ANALYTICS'],
  members: ['TEAMS', 'MANAGE_MEMBERS', 'INVITE_MEMBERS'],
  settings: ['SETTINGS'],
  channel: ['CHANNEL', 'CHANNELS'],
  team: ['TEAMS', 'MANAGE_MEMBERS'],
};

export default function TabPermissionGuard({
  activeTab,
  permission,
  viewerPermissions,
  canManageCompany,
  isOwnProfile,
  children,
}: TabPermissionGuardProps) {
  const searchParams = useSearchParams();
  const { activeProfile, isCompany, isLoading } = useActiveProfile();
  const { checkPermission } = useCompanyPermissions(activeProfile);

  // During company deactivation or deletion transition, retain existing children
  const isTransitioning =
    typeof window !== 'undefined' &&
    ((window as any).__cocpit_is_deactivating ||
      (window as any).__cocpit_is_deleting ||
      sessionStorage.getItem('cocpit_is_deactivating') === 'true' ||
      sessionStorage.getItem('cocpit_is_deleting') === 'true');

  if (isTransitioning) {
    return <>{children}</>;
  }

  // If loading or completely external public profile, render children
  if (isLoading || (!isCompany && !isOwnProfile)) {
    return <>{children}</>;
  }

  // Determine current tab
  const currentTab = (activeTab || searchParams.get('tab') || 'home').toLowerCase();

  // Determine required permissions
  const requiredPermissions = permission
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

  const hasPermission =
    Boolean(canManageCompany) ||
    (viewerPermissions && (viewerPermissions.includes('*') || viewerPermissions.includes('MANAGE_COMPANY'))) ||
    permsArray.some((p) => viewerPermissions?.includes(p)) ||
    (isCompany && (checkPermission('*') || permsArray.some((p) => checkPermission(p))));

  if (!hasPermission) {
    return <AccessDenied title="You don't have access to this screen" />;
  }

  return <>{children}</>;
}
