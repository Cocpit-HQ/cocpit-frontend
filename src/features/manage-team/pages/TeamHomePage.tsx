'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { TeamRole } from '../types/team.types';
import RoleList from '../components/roles/RoleList';
import TeamEmptyState from '../components/TeamEmptyState';

interface TeamHomePageProps {
  roles: TeamRole[];
  onEditRole: (role: TeamRole) => void;
  onDeleteRole: (role: TeamRole) => void;
}

export default function TeamHomePage({
  roles,
  onEditRole,
  onDeleteRole,
}: TeamHomePageProps) {
  const router = useRouter();

  if (roles.length === 0) {
    return <TeamEmptyState onCreateRole={() => {}} />;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <RoleList
        roles={roles}
        onRoleClick={(role) => router.push(`/team/role/${role.id}`)}
        onEditRole={onEditRole}
        onDeleteRole={onDeleteRole}
      />
    </div>
  );
}
