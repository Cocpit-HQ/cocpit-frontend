'use client';

import React from 'react';
import { Icon } from '@/components/icons';
import { useSession } from 'next-auth/react';
import { TeamMember } from '../../types/team.types';
import Avatar from '@/components/shared/Avatar';

interface MemberRowProps {
  member: TeamMember;
  onRemove?: () => void;
}

export default function MemberRow({ member, onRemove }: MemberRowProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || (session?.user as any)?.sub;

  const isSelf = Boolean(currentUserId && (member.id === currentUserId || member.userId === currentUserId));
  const isOwner = Boolean(
    member.isOwner ||
    (member as any).is_owner ||
    member.roleName?.toLowerCase() === 'owner'
  );

  const displayEmail = member.email ||
    (member.headline?.includes('@') ? member.headline : null) ||
    `${member.name.split(' ')[0].toLowerCase()}.${member.name.split(' ')[1]?.toLowerCase() || 'user'}@example.com`;

  const avatarUrl = member.avatarUrl || (member as any).avatar || (member as any).avatar_url;

  return (
    <div className="flex min-h-14 w-full items-center justify-between gap-2 py-2 font-['DM_Sans',sans-serif]">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar
          url={avatarUrl}
          name={member.name || 'User'}
          size="sm"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-['DM_Sans',sans-serif] text-[14px] leading-5 font-normal text-ds-text-primary truncate">
            {member.name}
          </span>
          <span className="font-['DM_Sans',sans-serif] text-[12px] leading-4 text-ds-text-secondary truncate">
            {displayEmail}
          </span>
        </div>
      </div>

      <div className="flex items-center">
        {isOwner ? (
          <span className="font-['DM_Sans',sans-serif] shrink-0 text-[14px] leading-5 font-medium text-ds-accent">
            Owner
          </span>
        ) : onRemove && !isSelf ? (
          <button
            onClick={onRemove}
            className="font-['DM_Sans',sans-serif] shrink-0 text-[14px] leading-5 font-medium text-ds-accent hover:opacity-80 transition-opacity"
          >
            Remove member
          </button>
        ) : null}
      </div>
    </div>
  );
}


