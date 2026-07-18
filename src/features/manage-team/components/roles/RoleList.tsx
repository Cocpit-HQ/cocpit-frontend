'use client';

import React from 'react';
import { TeamRole } from '../../types/team.types';
import RoleCard from './RoleCard';

interface RoleListProps {
  roles: TeamRole[];
  onRoleClick: (role: TeamRole) => void;
  onEditRole: (role: TeamRole) => void;
  onDeleteRole: (role: TeamRole) => void;
}

export default function RoleList({
  roles,
  onRoleClick,
  onEditRole,
  onDeleteRole,
}: RoleListProps) {
  return (
    <div className="w-full flex flex-col">
      {/* Table header */}
      <div className="w-full flex items-center justify-between px-3 py-2">
        <span className="text-xs text-gray-400 dark:text-gray-500 font-['Poppins'] font-medium">
          Role
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-['Poppins'] font-medium min-w-[70px] text-right">
            Members
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-['Poppins'] font-medium w-[60px]" />
          <span className="w-4" />
        </div>
      </div>

      {/* Role rows */}
      <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            onClick={() => onRoleClick(role)}
            onEdit={() => onEditRole(role)}
            onDelete={() => onDeleteRole(role)}
          />
        ))}
      </div>
    </div>
  );
}
