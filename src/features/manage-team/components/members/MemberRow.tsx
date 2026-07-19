'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { TeamMember } from '../../types/team.types';

interface MemberRowProps {
  member: TeamMember;
  onRemove?: () => void;
}

export default function MemberRow({ member, onRemove }: MemberRowProps) {
  // Use headline as a mock email for the UI if email is not available
  const mockEmail = member.headline?.includes('@') 
    ? member.headline 
    : `${member.name.split(' ')[0].toLowerCase()}.${member.name.split(' ')[1]?.toLowerCase() || 'user'}@example.com`;

  return (
    <div className="w-full flex items-center justify-between py-2">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/pngegg.png';
          }}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-semibold text-[#000000] dark:text-gray-200 font-['Poppins'] truncate">
            {member.name}
          </span>
          <span className="text-[12px] text-[#707EAE] dark:text-gray-500 font-['Poppins'] truncate">
            {mockEmail}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-[13px] font-medium text-[#F15156] hover:text-red-600 transition-colors"
          >
            Remove member
          </button>
        )}
      </div>
    </div>
  );
}
