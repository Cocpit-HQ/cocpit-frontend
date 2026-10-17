'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TeamRole, TeamMember } from '../types/team.types';
import { useTeamRoles } from '../hooks/useTeamRoles';
import { useCreateRole } from '../hooks/useCreateRole';
import { useUpdateRole } from '../hooks/useUpdateRole';
import { useDeleteRole } from '../hooks/useDeleteRole';
import { useInviteMember } from '../hooks/useInviteMember';

import TeamTabs from '../components/TeamTabs';
import TeamHomePage from './TeamHomePage';
import TeamActivityLogPage from './TeamActivityLogPage';
import CreateRoleModal from '../components/roles/CreateRoleModal';
import EditRoleModal from '../components/roles/EditRoleModal';
import DeleteRoleConfirm from '../components/roles/DeleteRoleConfirm';
import InviteMemberModal from '../components/members/InviteMemberModal';
import { CreateRoleInput, UpdateRoleInput } from '../types/team.types';
import { Loader2 } from 'lucide-react';

export default function ManageTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { roles, isLoading } = useTeamRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const inviteMember = useInviteMember();

  // Read initial tab from the URL so a refresh lands back on Activity logs
  // instead of resetting to Roles — same pattern as RoleDetailsPage.
  const urlTab = searchParams?.get('tab');
  const [activeTab, setActiveTabLocal] = useState<'team' | 'activity'>(
    urlTab === 'activity' ? 'activity' : 'team'
  );

  const setActiveTab = useCallback((tab: 'team' | 'activity') => {
    setActiveTabLocal(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === 'team') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.replace(`${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [router]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamRole | null>(null);
  const [inviteTarget, setInviteTarget] = useState<TeamRole | null>(null);

  const handleCreate = (input: CreateRoleInput) => {
    createRole.mutate(input, {
      onSuccess: () => setIsCreateOpen(false),
    });
  };

  const handleUpdate = (input: UpdateRoleInput) => {
    if (!editTarget) return;
    updateRole.mutate(
      { roleId: editTarget.id, input },
      { onSuccess: () => setEditTarget(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRole.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--ds-accent)]" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[calc(100vh-120px)] bg-ds-bg text-ds-text-primary flex flex-col items-center sm:-mt-[40px] pt-[20px] pb-16 px-0 md:px-4 md:pr-[253px] select-text">
      <div className="w-full max-w-[780px] flex flex-col gap-4 lg:gap-5 items-start px-4 lg:px-0">

        {/* Tabs and Actions */}
        <div className="flex flex-row justify-between items-center w-full gap-3 lg:gap-0 pl-0 lg:pl-[20px]">
          <TeamTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'team' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-[36px] px-[12px] py-[6px] rounded-full border border-ds-border text-ds-text-primary ds-text-body-1 flex justify-center items-center gap-[10px] whitespace-nowrap"
            >
              Create role
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'team' ? (
          <TeamHomePage
            roles={roles}
            onEditRole={(role) => setEditTarget(role)}
            onDeleteRole={(role) => setDeleteTarget(role)}
            onInviteRole={(role) => setInviteTarget(role)}
          />
        ) : (
          <TeamActivityLogPage roles={roles} />
        )}

        {/* Modals */}
        <CreateRoleModal
          isOpen={isCreateOpen}
          isSubmitting={createRole.isPending}
          existingRoles={roles?.map(r => r.name) || []}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
        />

        <EditRoleModal
          isOpen={!!editTarget}
          role={editTarget}
          isSubmitting={updateRole.isPending}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdate}
        />

        <DeleteRoleConfirm
          isOpen={!!deleteTarget}
          roleName={deleteTarget?.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        <InviteMemberModal
          isOpen={!!inviteTarget}
          onClose={() => setInviteTarget(null)}
          onInvite={(userId) => {
            if (inviteTarget) {
              inviteMember.mutate({ userId, roleId: inviteTarget.id }, {
                onSuccess: () => setInviteTarget(null)
              });
            }
          }}
        />
      </div>
    </div>
  );
}
