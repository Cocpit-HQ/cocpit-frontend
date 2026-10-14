'use client';

import React from 'react';
import { Icon, AddIcon } from '@/components/icons';
import { TeamMember, PendingInvitation } from '../../types/team.types';
import MemberRow from './MemberRow';
import Avatar from '@/components/shared/Avatar';

interface MemberListProps {
  members: TeamMember[];
  pendingInvites?: PendingInvitation[];
  onRemoveMember?: (member: TeamMember) => void;
  onInviteClick?: () => void;
  onWithdrawInvitation?: (inviteId: string) => void;
}

export default function MemberList({ members, pendingInvites = [], onRemoveMember, onInviteClick, onWithdrawInvitation }: MemberListProps) {
  return (
    <div className="w-full flex flex-col gap-5 font-['DM_Sans',sans-serif]">
      {/* Header */}
      <div className="flex h-9 w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-['DM_Sans',sans-serif] text-[16px] leading-6 font-medium text-ds-text-primary">
            All members
          </span>
          <span className="h-1 w-1 rounded-full bg-ds-text-muted shrink-0" />
          <span className="font-['DM_Sans',sans-serif] text-[14px] leading-5 text-ds-text-secondary">
            {members.length} total
          </span>
        </div>

        {onInviteClick && (
          <button
            onClick={onInviteClick}
            className="flex w-[160px] h-[36px] shrink-0 items-center justify-center gap-2 rounded-full border border-ds-border font-['DM_Sans',sans-serif] text-[16px] leading-6 font-medium text-ds-text-primary hover:bg-ds-surface-1 transition-colors box-border"
          >
            <AddIcon size={16} className="w-4 h-4 text-ds-text-primary shrink-0" />
            Invite member
          </button>
        )}
      </div>

      <div className="flex w-full flex-col gap-3">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            onRemove={onRemoveMember ? () => onRemoveMember(member) : undefined}
          />
        ))}
        {members.length === 0 && (
          <p className="font-['DM_Sans',sans-serif] text-[14px] leading-5 text-ds-text-muted py-4 text-center">No members assigned to this role.</p>
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div className="flex w-full flex-col gap-3 mt-2">
          <div className="flex h-9 w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-['DM_Sans',sans-serif] text-[16px] leading-6 font-medium text-ds-text-primary">
                Sent invitation{pendingInvites.length > 1 ? 's' : ''}
              </span>
              <span className="h-1 w-1 rounded-full bg-ds-text-muted shrink-0" />
              <span className="font-['DM_Sans',sans-serif] text-[14px] leading-5 text-ds-text-secondary">
                {pendingInvites.length} total
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3">
            {pendingInvites.map((invite) => {
              const displayEmail = invite.email ||
                (invite.headline?.includes('@') ? invite.headline : null) ||
                'Email unavailable';

              const avatarUrl = invite.avatarUrl || (invite as any).avatar || (invite as any).avatar_url;

              return (
                <div key={invite.id} className="flex min-h-14 w-full items-center justify-between gap-2 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar
                      url={avatarUrl}
                      name={invite.name}
                      size="sm"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-['DM_Sans',sans-serif] text-[14px] leading-5 font-normal text-ds-text-primary truncate">
                        {invite.name}
                      </span>
                      <span className="font-['DM_Sans',sans-serif] text-[12px] leading-4 text-ds-text-secondary truncate">
                        {displayEmail}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onWithdrawInvitation?.(invite.id)}
                    className="font-['DM_Sans',sans-serif] shrink-0 text-[14px] leading-5 font-medium text-ds-text-secondary hover:text-ds-text-primary transition-colors"
                  >
                    Withdraw Invitation
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

