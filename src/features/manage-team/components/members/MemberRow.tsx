'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { useSession } from 'next-auth/react';
import { TeamMember } from '../../types/team.types';

interface MemberRowProps {
  member: TeamMember;
  onRemove?: () => void;
}

export default function MemberRow({ member, onRemove }: MemberRowProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || (session?.user as any)?.sub;

  const isSelf = Boolean(currentUserId && (member.id === currentUserId || (member as any).userId === currentUserId));
  const isOwner = Boolean(
    (member as any).isOwner ||
    (member as any).is_owner ||
    member.roleName?.toLowerCase() === 'owner'
  );

  const displayEmail = member.email ||
    (member.headline?.includes('@') ? member.headline : null) ||
    `${member.name.split(' ')[0].toLowerCase()}.${member.name.split(' ')[1]?.toLowerCase() || 'user'}@example.com`;

  return (
    <div className="w-full flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={member.avatarUrl || '/assets/pngegg.png'}
          alt={member.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/pngegg.png';
          }}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-semibold text-company-text font-['Poppins'] truncate">
            {member.name}
          </span>
          <span className="text-[12px] text-company-secondary font-['Poppins'] truncate">
            {displayEmail}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isOwner ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-company-light-primary border border-company-border text-company-primary rounded-full text-[12px] font-medium font-['Poppins']">
            <Icon icon="material-symbols:admin-panel-settings-outline" className="w-4 h-4" />
            <span>Owner</span>
          </div>
        ) : onRemove && !isSelf ? (
          <button
            onClick={onRemove}
            className="text-[13px] font-medium text-[#F15156] dark:text-[#F87171] hover:text-red-600 dark:hover:text-red-400 transition-colors font-['Poppins']"
          >
            Remove member
          </button>
        ) : null}
      </div>
    </div>
  );
}

