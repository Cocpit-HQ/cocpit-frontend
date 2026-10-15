'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { LeftArrowIcon, DeleteIcon } from '@/components/icons';
import { useRoleDetails } from '../hooks/useRoleDetails';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useRemoveMember } from '../hooks/useRemoveMember';
import { useInviteMember } from '../hooks/useInviteMember';
import { useDeleteRole } from '../hooks/useDeleteRole';
import { useWithdrawInvite } from '../hooks/useWithdrawInvite';
import { TeamMember, ActivityLogFilters, UpdateRoleInput, PendingInvitation, PERMISSION_LABELS, getPermissionLabel } from '../types/team.types';
import { useDebounce } from '@/hooks/use-debounce';
import MemberList from '../components/members/MemberList';
import InviteMemberModal from '../components/members/InviteMemberModal';
import RemoveMemberConfirm from '../components/members/RemoveMemberConfirm';
import WithdrawInviteConfirm from '../components/members/WithdrawInviteConfirm';
import ActivityLogTable from '../components/activity/ActivityLogTable';
import ActivityLogFiltersBar from '../components/activity/ActivityLogFilters';
import DeleteRoleConfirm from '../components/roles/DeleteRoleConfirm';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/businessProfile';
import { useSession } from 'next-auth/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RoleDetailsPageProps {
  roleId: string;
}

export default function RoleDetailsPage({ roleId }: RoleDetailsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || (session?.user as any)?.sub;
  const { activeProfile } = useActiveProfile();
  const perms = useCompanyPermissions(activeProfile);
  const hasActivityPermission = perms.checkPermission('ACTIVITY_LOGS');

  const { role, isLoading } = useRoleDetails(roleId);
  const removeMember = useRemoveMember();
  const inviteMember = useInviteMember();
  const deleteRole = useDeleteRole();
  const withdrawInvite = useWithdrawInvite();

  // Check if current viewer is the organization Owner
  const isCurrentUserOwner = Boolean(
    perms.isOwner ||
    (role && role.members.some(m => m.isOwner && (m.id === currentUserId || m.userId === currentUserId)))
  );

  const isAdminRole = role ? role.name.toUpperCase() === 'ADMIN' : false;

  const isCurrentUserAdmin = Boolean(
    perms.isAdmin ||
    (role && isAdminRole && role.members.some(m => m.status === 'ACTIVE' && (m.id === currentUserId || m.userId === currentUserId)))
  );

  // On Admin role, removing members is restricted strictly to the organization Owner
  const canRemoveMember = isAdminRole
    ? isCurrentUserOwner
    : Boolean(isCurrentUserOwner || perms.canManageMembers);

  // Inviting members: on Admin role, strictly only Admin members or Owner can invite
  const canInviteMember = isAdminRole
    ? Boolean(isCurrentUserOwner || isCurrentUserAdmin)
    : Boolean(isCurrentUserOwner || perms.canManageMembers);

  // Read initial sub-tab from the URL so a refresh (or a shared link) lands
  // back on Activity logs instead of resetting to Members.
  const urlTab = searchParams?.get('tab');
  const [activeTab, setActiveTabLocal] = useState<'members' | 'activity'>(
    urlTab === 'activity' ? 'activity' : 'members'
  );

  // Wrap setActiveTab to also persist the selected sub-tab in the URL, same
  // pattern as jobs/MyListingsDashboard's subtab/filter query params.
  const setActiveTab = useCallback((tab: 'members' | 'activity') => {
    setActiveTabLocal(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === 'members') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.replace(`${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [router]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Activity log filters for this role
  const [logFilters, setLogFilters] = useState<ActivityLogFilters>({
    search: '',
    roleId: roleId,
    memberId: 'all',
    dateRange: 'last_7_days',
  });
  // Debounce free-text search before it hits the query key, same as TeamActivityLogPage
  const debouncedSearch = useDebounce(logFilters.search, 300);
  const effectiveSearch = debouncedSearch.trim().length >= 3 ? debouncedSearch.trim() : '';
  const queryLogFilters: ActivityLogFilters = { ...logFilters, search: effectiveSearch };

  const { logs, isLoading: logsLoading, isFetchingMore: logsFetchingMore, hasMore: logsHasMore, loadMore: loadMoreLogs } = useActivityLogs(queryLogFilters);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--ds-accent)]" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 gap-4 font-['DM_Sans',sans-serif]">
        <p className="font-['DM_Sans',sans-serif] ds-text-body text-ds-text-muted">Role not found.</p>
        <button
          onClick={() => router.push('/team')}
          className="text-[var(--ds-accent)] ds-text-secondary-1 hover:underline font-['DM_Sans',sans-serif]"
        >
          ← Back to team
        </button>
      </div>
    );
  }

  const handleRemove = () => {
    if (!removeTarget) return;
    removeMember.mutate(removeTarget.id, {
      onSuccess: () => setRemoveTarget(null),
    });
  };

  const handleWithdraw = () => {
    if (!withdrawTargetId) return;
    withdrawInvite.mutate(withdrawTargetId, {
      onSuccess: () => setWithdrawTargetId(null),
    });
  };

  const handleDelete = () => {
    if (!role) return;
    deleteRole.mutate(role.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        router.push('/team');
      },
    });
  };

  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary pt-4 md:pt-[60px] pb-16 relative font-['DM_Sans',sans-serif]">
      {/* Back button (Frame 2609475: top: 40px, left: 40px, width: hug 65px, height: hug 24px, gap: 8px) */}
      <div className="absolute left-[40px] top-[40px] hidden md:block">
        <button
          onClick={() => router.push('/team')}
          aria-label="Back"
          className="h-[24px] flex flex-row items-center p-0 gap-[8px] cursor-pointer text-ds-text-primary hover:opacity-80 transition-opacity"
        >
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <LeftArrowIcon size={20} className="w-[20px] h-[20px] text-ds-text-primary" />
          </div>
          <span className="h-[24px] font-['DM_Sans',sans-serif] font-medium text-[16px] leading-[24px] text-center text-ds-text-primary">
            Back
          </span>
        </button>
      </div>

      <main className="mx-auto flex w-full max-w-[800px] flex-col gap-4 md:gap-5 px-4 md:px-0 font-['DM_Sans',sans-serif]">
        {/* Mobile back button (shows only on small screens) */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => router.push('/team')}
            aria-label="Back"
            className="h-[24px] flex flex-row items-center p-0 gap-2 cursor-pointer text-ds-text-primary hover:opacity-80 transition-opacity -ml-1"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary" />
            </div>
            <span className="font-['DM_Sans',sans-serif] font-medium text-[16px] leading-[24px] text-center text-ds-text-primary">
              Back
            </span>
          </button>
        </div>

        {/* Page title */}
        <h2 className="h-6 font-['DM_Sans',sans-serif] text-[16px] leading-6 font-semibold text-ds-text-primary">
          Role details
        </h2>

        {/* Role header */}
        <section className="flex w-full flex-col gap-2">
          <div className="flex w-full h-6 items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 md:w-6 md:h-6 shrink-0 rounded-full"
                style={{ backgroundColor: role.color || 'var(--ds-accent)' }}
              />
              <h1 className="font-['DM_Sans',sans-serif] text-[16px] leading-6 font-semibold text-ds-text-primary">
                {role.name}
              </h1>
            </div>
            {!role.isSystemRole && (
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="flex h-[20px] w-[20px] items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity"
                aria-label="Delete role"
                title="Delete role"
              >
                <DeleteIcon size={20} className="w-[20px] h-[20px] text-ds-text-primary shrink-0" />
              </button>
            )}
          </div>
          
          <div
            className="box-border flex min-h-10 w-full items-center border-l-2 pl-2"
            style={{ borderColor: role.color || 'var(--ds-accent)' }}
          >
            <p className="font-['DM_Sans',sans-serif] text-[14px] leading-5 text-ds-text-secondary">
              {role.description || (isAdminRole ? 'Administrator Has full access to all modules and features of the application. Administrators can view, manage, create, edit, and delete any data, as well as configure settings and oversee all system activities' : 'No description provided.')}
            </p>
          </div>
        </section>

        {/* Sub-tabs: Members | Activity logs */}
        <div className="flex h-9 w-full items-center gap-[12px] md:gap-6">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex h-9 items-center justify-center px-2 md:px-3 font-['DM_Sans',sans-serif] text-[16px] leading-6 font-medium transition-colors ${
              activeTab === 'members'
                ? 'border-b-[1.5px] border-ds-accent text-ds-text-primary'
                : 'border-b-[1.5px] border-transparent text-ds-text-secondary hover:text-ds-text-primary'
            }`}
          >
            Members
          </button>
          {hasActivityPermission ? (
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex h-9 items-center justify-center px-3 font-['DM_Sans',sans-serif] text-[16px] leading-6 font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'border-b-[1.5px] border-ds-accent text-ds-text-primary'
                  : 'border-b-[1.5px] border-transparent text-ds-text-secondary hover:text-ds-text-primary'
              }`}
            >
              Team activity
            </button>
          ) : (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="!cursor-not-allowed">
                    <button
                      disabled
                      className="flex h-9 items-center font-['DM_Sans',sans-serif] text-[16px] leading-6 font-medium opacity-50 !cursor-not-allowed bg-transparent text-ds-text-muted"
                    >
                      Team activity
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-ds-surface-2 text-ds-text-primary border-ds-border font-['DM_Sans',sans-serif]">
                  <p>You don't have permission to access this</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'members' ? (
          <MemberList
            members={role.members.filter(m => m.status === 'ACTIVE')}
            pendingInvites={role.members.filter(m => m.status === 'PENDING_INVITE').map(m => ({
              id: m.inviteId || '',
              userId: m.id,
              name: m.name,
              avatarUrl: m.avatarUrl,
              email: m.email,
              headline: m.headline,
              roleId: role.id,
              roleName: role.name,
              roleColor: role.color,
              invitedAt: m.joinedAt
            } as PendingInvitation))}
            onRemoveMember={canRemoveMember ? (member) => setRemoveTarget(member) : undefined}
            onInviteClick={canInviteMember ? () => setIsInviteOpen(true) : undefined}
            onWithdrawInvitation={(inviteId) => setWithdrawTargetId(inviteId)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <ActivityLogFiltersBar
              filters={logFilters}
              onFiltersChange={setLogFilters}
              memberOptions={role.members.filter(m => m.status === 'ACTIVE').map((m) => ({
                value: m.id,
                label: m.name,
              }))}
              hideRoleDropdown={true}
              variant="compact"
            />
            <ActivityLogTable
              logs={logs}
              isLoading={logsLoading}
              hasMore={logsHasMore}
              isFetchingMore={logsFetchingMore}
              loadMore={loadMoreLogs}
            />
          </div>
        )}

        {/* Modals */}
        <InviteMemberModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          onInvite={(userId) => {
            inviteMember.mutate({ userId, roleId: role.id });
          }}
        />

        <RemoveMemberConfirm
          isOpen={!!removeTarget}
          memberName={removeTarget?.name}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
        />

        <WithdrawInviteConfirm
          isOpen={!!withdrawTargetId}
          onConfirm={handleWithdraw}
          onCancel={() => setWithdrawTargetId(null)}
        />

        <DeleteRoleConfirm
          isOpen={isDeleteOpen}
          roleName={role?.name}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      </main>
    </div>
  );
}
