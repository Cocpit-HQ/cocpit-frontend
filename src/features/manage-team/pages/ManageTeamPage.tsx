'use client';

import React, { useState } from 'react';
import { TeamRole, TeamMember } from '../types/team.types';
import { useTeamRoles } from '../hooks/useTeamRoles';
import { useCreateRole } from '../hooks/useCreateRole';
import { useUpdateRole } from '../hooks/useUpdateRole';
import { useDeleteRole } from '../hooks/useDeleteRole';
import { useInviteMember } from '../hooks/useInviteMember';
import TeamHeader from '../components/TeamHeader';
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
  const { roles, isLoading } = useTeamRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const inviteMember = useInviteMember();

  const [activeTab, setActiveTab] = useState<'team' | 'activity'>('team');
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
        <Loader2 className="w-6 h-6 animate-spin text-[#1A73E8]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-8 px-4 xl:px-0">
      <div className="w-full max-w-[998px] mx-auto flex flex-col gap-5">
        {/* Header */}
        <TeamHeader onCreateRole={() => setIsCreateOpen(true)} />

        {/* Tabs */}
        <TeamTabs activeTab={activeTab} onTabChange={setActiveTab} />

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
