'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/components/organizations/hooks/use-company';
import AccessDenied from './AccessDenied';

interface RouteGuardProps {
  /** Permission key or array of keys to check */
  permission: string | string[];
  /** If true, user needs ANY one of the permissions (OR logic). Default: false (AND logic). */
  matchAny?: boolean;
  /** If true, personal profiles are denied access. Default: false. */
  requireCompany?: boolean;
  /** If true, company profiles are denied access. Default: false. */
  requirePersonal?: boolean;
  children: React.ReactNode;
}

/**
 * RouteGuard — wraps page content with a permission check.
 *
 * - While profile is loading → shows a loader (prevents children from mounting / firing API calls)
 * - Personal profiles → always passes through (no restrictions)
 * - Company profiles → checks permission(s) and renders AccessDenied if denied
 *
 * Usage in a layout.tsx:
 *   <RouteGuard permission="CHANNELS">{children}</RouteGuard>
 *   <RouteGuard permission={["POST_JOBS", "VIEW_APPLICANTS"]} matchAny>{children}</RouteGuard>
 */
export default function RouteGuard({
  permission,
  matchAny = false,
  requireCompany = false,
  requirePersonal = false,
  children,
}: RouteGuardProps) {
  const { activeProfile, isCompany, isLoading } = useActiveProfile();
  const { checkPermission } = useCompanyPermissions(activeProfile);

  // While the active profile is still loading, show a loader.
  // This prevents children from mounting and firing API calls.
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  // Personal profiles
  if (!isCompany) {
    if (requireCompany) {
      return <AccessDenied />;
    }
    return <>{children}</>;
  }

  // Company profiles
  if (requirePersonal) {
    return <AccessDenied />;
  }

  // Check permission(s) only if permission is provided
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];

    const hasAccess = matchAny
      ? permissions.some((p) => checkPermission(p))
      : permissions.every((p) => checkPermission(p));

    if (!hasAccess) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
}
