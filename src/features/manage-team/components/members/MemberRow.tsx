'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { TeamMember } from '../../types/team.types';

interface MemberRowProps {
  member: TeamMember;
  onRemove?: () => void;
}

export default function MemberRow({ member, onRemove }: MemberRowProps) {
  return (
    <div className="w-full flex items-center justify-between py-3 group">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/pngegg.png';
          }}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 font-['Poppins'] truncate">
            {member.name}
          </span>
          {member.headline && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-['Poppins'] truncate">
              {member.headline}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        {member.roleName && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: member.roleColor || '#808080' }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-['Poppins']">
              {member.roleName}
            </span>
          </div>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove member"
          >
            <Icon icon="lucide:x" className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
