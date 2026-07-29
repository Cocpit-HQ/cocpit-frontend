'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { TeamMember, PendingInvitation } from '../../types/team.types';
import MemberRow from './MemberRow';

interface MemberListProps {
  members: TeamMember[];
  pendingInvites?: PendingInvitation[];
  onRemoveMember?: (member: TeamMember) => void;
  onInviteClick?: () => void;
  onWithdrawInvitation?: (inviteId: string) => void;
}

export default function MemberList({ members, pendingInvites = [], onRemoveMember, onInviteClick, onWithdrawInvitation }: MemberListProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] text-[#000000] dark:text-white font-['Poppins'] font-semibold">
            All members
          </span>
          <span className="text-[12px] text-[#A3AED0] dark:text-gray-500 font-['Poppins']">
            Total - {members.length}
          </span>
        </div>

        {onInviteClick && (
          <button
            onClick={onInviteClick}
            className="flex items-center gap-1.5 text-[#1A73E8] dark:text-[#4D9CFF] text-[13px] font-medium font-['Poppins'] hover:underline"
          >
            <Icon icon="lucide:plus" className="w-3.5 h-3.5" />
            Invite members
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            onRemove={onRemoveMember ? () => onRemoveMember(member) : undefined}
          />
        ))}
        {members.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">No members assigned to this role.</p>
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div className="flex flex-col mt-4">
          <span className="text-[12px] text-[#A3AED0] dark:text-gray-500 font-['Poppins'] mb-2">
            Sent invitations - {pendingInvites.length}
          </span>
          {pendingInvites.map((invite) => {
            const displayEmail = invite.email ||
              (invite.headline?.includes('@') ? invite.headline : null) ||
              'Email unavailable';

            const avatarUrl = invite.avatarUrl || (invite as any).avatar || (invite as any).avatar_url;
            const initial = invite.name ? invite.name.charAt(0).toUpperCase() : 'U';

            return (
              <div key={invite.id} className="w-full flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={invite.avatarUrl}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/pngegg.png'; }}
                    alt={invite.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-semibold text-[#000000] dark:text-gray-200 font-['Poppins'] truncate">
                      {invite.name}
                    </span>
                    <span className="text-[12px] text-[#707EAE] dark:text-gray-400 font-['Poppins'] truncate">
                      {displayEmail}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onWithdrawInvitation?.(invite.id)}
                  className="text-[13px] text-[#A3AED0] dark:text-gray-400 font-['Poppins'] font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Withdraw invitation
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
