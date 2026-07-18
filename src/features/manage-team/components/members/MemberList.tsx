'use client';

import React from 'react';
import { TeamMember } from '../../types/team.types';
import MemberRow from './MemberRow';

interface MemberListProps {
  members: TeamMember[];
  onRemoveMember?: (member: TeamMember) => void;
}

export default function MemberList({ members, onRemoveMember }: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-10">
        <p className="text-sm text-gray-400 dark:text-gray-500 font-['Poppins']">
          No members assigned to this role.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
      {/* Header */}
      <div className="text-xs text-gray-400 dark:text-gray-500 font-['Poppins'] font-medium pb-2">
        All members ({members.length})
      </div>

      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          onRemove={onRemoveMember ? () => onRemoveMember(member) : undefined}
        />
      ))}
    </div>
  );
}
