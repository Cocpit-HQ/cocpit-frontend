'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';
import { useRoleDetails } from '../hooks/useRoleDetails';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useRemoveMember } from '../hooks/useRemoveMember';
import { useInviteMember } from '../hooks/useInviteMember';
import { useUpdateRole } from '../hooks/useUpdateRole';
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
import EditRoleModal from '../components/roles/EditRoleModal';
import DeleteRoleConfirm from '../components/roles/DeleteRoleConfirm';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/companyprofile/hooks/useCompanyPermissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RoleDetailsPageProps {
  roleId: string;
}

export default function RoleDetailsPage({ roleId }: RoleDetailsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProfile } = useActiveProfile();
  const perms = useCompanyPermissions(activeProfile);
  const hasActivityPermission = perms.checkPermission('ACTIVITY_LOGS');

  const { role, isLoading } = useRoleDetails(roleId);
  const removeMember = useRemoveMember();
  const inviteMember = useInviteMember();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const withdrawInvite = useWithdrawInvite();

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
  const [isEditOpen, setIsEditOpen] = useState(false);
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
        <Loader2 className="w-6 h-6 animate-spin text-[#1A73E8]" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-gray-500 font-['Poppins']">Role not found.</p>
        <button
          onClick={() => router.push('/team')}
          className="text-[#1A73E8] text-sm font-['Poppins'] hover:underline"
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

  const handleUpdate = (input: UpdateRoleInput) => {
    if (!role) return;
    updateRole.mutate(
      { roleId: role.id, input },
      { onSuccess: () => setIsEditOpen(false) }
    );
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

  const isAdminRole = role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'administrator';

  return (
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-8 px-4 xl:px-0">
      <div className="w-full max-w-[998px] mx-auto flex flex-col gap-5">
        {/* Back + breadcrumb */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/team')}
            className="w-12 h-12 rounded-full border border-[#DADADA] dark:border-gray-700 backdrop-blur-[12px] flex items-center justify-center text-[#6B7280] dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors shrink-0"
          >
            <Icon icon="lucide:chevron-left" className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <span className="text-[16px] font-semibold text-[#000000] dark:text-white font-['Poppins']">
              Role details
            </span>
            <span className="text-[12px] text-[#A3AED0] dark:text-gray-400 font-['Poppins']">
              Explore articles, insights, and updates shared by the community.
            </span>
          </div>
        </div>
        {/* Role header card */}
        {isAdminRole ? (
          <div className="flex flex-col border border-company-border rounded-[24px] p-5 bg-company-card gap-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#00C2FF] flex-shrink-0" />
              <h1 className="text-[24px] font-semibold leading-[24px] text-company-text font-['Poppins']">
                {role.name}
              </h1>
            </div>

            <div className="flex flex-col gap-2 w-full mt-1">
              <h3 className="text-[18px] font-medium leading-[27px] text-company-text font-['Poppins']">
                Description
              </h3>
              <div className="bg-company-ultra-light border-l-[4px] border-[#0D47A1] dark:border-l-[#82B8FF] py-3 px-4 flex flex-col gap-2 w-full rounded-r-md">
                <p className="text-[15px] leading-[24px] font-normal text-company-secondary font-['Poppins']">
                  {role.description || 'Administrator Has full access to all modules and features of the application. Administrators can view, manage, create, edit, and delete any data, as well as configure settings and oversee all system activities'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col border border-company-border rounded-[24px] p-4 bg-company-card gap-3">
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <h1 className="text-[24px] font-medium leading-[24px] text-company-text font-['Poppins'] flex items-center">
                  {role.name}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="w-6 h-6 relative hover:opacity-80 flex items-center justify-center"
                  title="Edit role"
                >
                  <Icon icon="fluent:edit-24-regular" className="w-5 h-5 text-company-text" />
                </button>
                {!role.isSystemRole && (
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="w-6 h-6 relative hover:opacity-80 flex items-center justify-center"
                    title="Delete role"
                  >
                    <Icon icon="fluent:delete-24-regular" className="w-5 h-5 text-[#EF4444] dark:text-[#F87171]" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full mt-2">
              <h3 className="text-[18px] font-medium leading-[27px] text-company-text font-['Poppins'] flex items-center">
                Description
              </h3>
              <div className="bg-company-ultra-light border-l-[4px] border-[#0D47A1] dark:border-l-[#82B8FF] py-2 px-4 flex flex-col gap-2 w-full rounded-r-md">
                <p className="text-[16px] leading-[24px] font-normal text-company-secondary font-['Poppins'] flex items-center">
                  {role.description || 'No description provided.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full mt-2">
              <h3 className="text-[18px] font-medium leading-[27px] text-company-text font-['Poppins'] flex items-center">
                Permissions
              </h3>
              <div className="flex flex-wrap gap-4 mt-1">
                {role.permissions?.length > 0 ? (
                  role.permissions.map(p => {
                    const label = getPermissionLabel(p);
                    return (
                      <div key={p} className="box-border flex flex-row justify-center items-center bg-company-light-primary border border-company-border rounded-lg">
                        <div className="flex flex-row justify-center items-center px-4 py-[6px] gap-2">
                          <span className="text-[14px] font-normal leading-[20px] text-company-primary font-['Poppins'] text-center flex items-center">
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-[14px] text-company-secondary font-['Poppins']">No permissions</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sub-tabs: Members | Activity Log */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-1.5 rounded-[24px] text-[13px] font-medium font-['Poppins'] transition-colors ${
              activeTab === 'members'
                ? 'bg-company-light-primary text-company-primary border border-transparent'
                : 'bg-transparent text-company-primary border border-company-primary hover:bg-company-light-primary/50'
            }`}
          >
            Members
          </button>
          {hasActivityPermission ? (
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-1.5 rounded-[24px] text-[13px] font-medium font-['Poppins'] transition-colors ${
                activeTab === 'activity'
                  ? 'bg-company-light-primary text-company-primary border border-transparent'
                  : 'bg-transparent text-company-primary border border-company-primary hover:bg-company-light-primary/50'
              }`}
            >
              Activity logs
            </button>
          ) : (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="!cursor-not-allowed">
                    <button
                      disabled
                      className="px-4 py-1.5 rounded-[24px] text-[13px] font-medium font-['Poppins'] border border-[#9CA3AF] text-[#9CA3AF] opacity-50 !cursor-not-allowed bg-transparent"
                    >
                      Activity logs
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-800 text-white border-gray-700">
                  <p>You don't have permission to access this</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'members' ? (
          <div className="flex flex-col gap-4 mt-2">
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
              onRemoveMember={(member) => setRemoveTarget(member)}
              onInviteClick={() => setIsInviteOpen(true)}
              onWithdrawInvitation={(inviteId) => setWithdrawTargetId(inviteId)}
            />
          </div>
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

        <EditRoleModal
          isOpen={isEditOpen}
          role={role}
          isSubmitting={updateRole.isPending}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdate}
        />

        <DeleteRoleConfirm
          isOpen={isDeleteOpen}
          roleName={role?.name}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      </div>
    </div>
  );
}
