'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';
import { useRoleDetails } from '../hooks/useRoleDetails';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useRemoveMember } from '../hooks/useRemoveMember';
import { useInviteMember } from '../hooks/useInviteMember';
import { TeamMember, ActivityLogFilters } from '../types/team.types';
import MemberList from '../components/members/MemberList';
import InviteMemberModal from '../components/members/InviteMemberModal';
import RemoveMemberConfirm from '../components/members/RemoveMemberConfirm';
import ActivityLogTable from '../components/activity/ActivityLogTable';
import ActivityLogFiltersBar from '../components/activity/ActivityLogFilters';
import PermissionCheckList from '../components/permissions/PermissionCheckList';

interface RoleDetailsPageProps {
  roleId: string;
}

export default function RoleDetailsPage({ roleId }: RoleDetailsPageProps) {
  const router = useRouter();
  const { role, isLoading } = useRoleDetails(roleId);
  const removeMember = useRemoveMember();
  const inviteMember = useInviteMember();

  const [activeTab, setActiveTab] = useState<'members' | 'activity'>('members');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  // Activity log filters for this role
  const [logFilters, setLogFilters] = useState<ActivityLogFilters>({
    search: '',
    roleId: roleId,
    memberId: 'all',
    dateRange: 'last_7_days',
  });
  const { logs, isLoading: logsLoading } = useActivityLogs(logFilters);

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

  return (
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-8 px-4 xl:px-0">
      <div className="w-full max-w-[998px] mx-auto flex flex-col gap-5">
        {/* Back + breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-['Poppins']">
          <button
            onClick={() => router.push('/team')}
            className="text-gray-400 hover:text-[#1A73E8] transition-colors"
          >
            Role details
          </button>
        </div>

        {/* Role header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: role.color }}
            />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white font-['Poppins']">
              {role.name}
            </h1>
            <button className="p-1 rounded-lg text-gray-400 hover:text-[#1A73E8] transition-colors">
              <Icon icon="proicons:pencil" className="w-4 h-4" />
            </button>
          </div>
          {role.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-['Poppins'] max-w-[600px]">
              {role.description}
            </p>
          )}
        </div>

        {/* Permissions (read-only display) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Icon
              icon="lucide:shield-check"
              className="w-4 h-4 text-gray-400"
            />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 font-['Poppins']">
              Permissions
            </span>
          </div>
          <PermissionCheckList
            selected={role.permissions}
            onChange={() => {}}
            disabled
          />
        </div>

        {/* Sub-tabs: Members | Activity Log */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700">
          {['members', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'members' | 'activity')}
              className={`px-4 py-2.5 text-sm font-medium font-['Poppins'] transition-colors relative capitalize ${
                activeTab === tab
                  ? 'text-[#1A73E8] dark:text-[#4D9CFF]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'members' ? 'Members' : 'Activity log'}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A73E8] dark:bg-[#4D9CFF] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'members' ? (
          <div className="flex flex-col gap-4">
            {/* Invite button */}
            <div className="flex justify-end">
              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex items-center gap-1.5 text-[#1A73E8] dark:text-[#4D9CFF] text-sm font-semibold font-['Poppins'] hover:underline"
              >
                <Icon icon="lucide:plus" className="w-4 h-4" />
                Add members
              </button>
            </div>

            <MemberList
              members={role.members}
              onRemoveMember={(member) => setRemoveTarget(member)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <ActivityLogFiltersBar
              filters={logFilters}
              onFiltersChange={setLogFilters}
              roleOptions={[]}
              memberOptions={role.members.map((m) => ({
                value: m.id,
                label: m.name,
              }))}
            />
            <ActivityLogTable logs={logs} isLoading={logsLoading} />
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
      </div>
    </div>
  );
}
