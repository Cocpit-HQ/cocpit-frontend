'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { TeamRole } from '../../types/team.types';

interface RoleCardProps {
  role: TeamRole;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RoleCard({ role, onClick, onEdit, onDelete }: RoleCardProps) {
  return (
    <div
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1D24] transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Color dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: role.color }}
        />

        {/* Role name */}
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 font-['Poppins'] truncate">
          {role.name}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Member avatars */}
        <div className="flex items-center -space-x-2">
          {role.members.slice(0, 3).map((member) => (
            <img
              key={member.id}
              src={member.avatarUrl}
              alt={member.name}
              className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0F1115] object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/pngegg.png';
              }}
            />
          ))}
          {role.memberCount > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-[#0F1115] flex items-center justify-center">
              <span className="text-[9px] text-gray-600 dark:text-gray-300 font-medium">
                +{role.memberCount - 3}
              </span>
            </div>
          )}
        </div>

        {/* Member count */}
        <span className="text-xs text-gray-400 dark:text-gray-500 font-['Poppins'] min-w-[70px] text-right">
          {role.memberCount} member{role.memberCount !== 1 ? 's' : ''}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#1A73E8] hover:bg-[#EFF4FF] dark:hover:bg-[#1A2435] transition-colors"
            title="Edit role"
          >
            <Icon icon="proicons:pencil" className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete role"
          >
            <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Chevron */}
        <Icon
          icon="lucide:chevron-right"
          className="w-4 h-4 text-gray-300 dark:text-gray-600"
        />
      </div>
    </div>
  );
}
