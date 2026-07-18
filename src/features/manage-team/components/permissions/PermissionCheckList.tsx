'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { TeamPermission } from '../../types/team.types';

interface PermissionCheckListProps {
  selected: TeamPermission[];
  onChange: (permissions: TeamPermission[]) => void;
  disabled?: boolean;
}

const PERMISSION_GROUPS = [
  { id: 'create_post', label: 'Create post', icon: 'lucide:plus' },
  { id: 'channels', label: 'Channel', icon: 'quill:inbox-newsletter' },
  { id: 'chat', label: 'Chat', icon: 'hugeicons:comment-01', children: [
    { id: 'queries', label: 'Queries' }
  ]},
  { id: 'teams', label: 'Teams', icon: 'streamline-ultimate:team-meeting', children: [
    { id: 'activity_logs', label: 'Activity logs' }
  ]},
  { id: 'jobs', label: 'Jobs', icon: 'hugeicons:job-search', children: [
    { id: 'jobs_chat', label: 'Jobs chat' }
  ]},
  { id: 'analytics', label: 'Analytics', icon: 'hugeicons:analytics-up' }
] as const;

export default function PermissionCheckList({
  selected,
  onChange,
  disabled,
}: PermissionCheckListProps) {
  const toggle = (perm: TeamPermission) => {
    if (disabled) return;
    
    if (selected.includes(perm)) {
      let newSelected = selected.filter((p) => p !== perm);
      // If Teams is deactivated, also deactivate its children (Activity logs)
      if (perm === 'teams') {
        newSelected = newSelected.filter((p) => p !== 'activity_logs');
      }
      onChange(newSelected);
    } else {
      onChange([...selected, perm]);
    }
  };

  return (
    <div className="flex flex-col p-4 gap-4 bg-[#EFF4FF] rounded-[24px]">
      <div className="text-[16px] font-semibold text-[#000000] leading-[25px] font-['Poppins']">
        Permissions
      </div>
      <div className="flex flex-col gap-4">
        {PERMISSION_GROUPS.map((group) => {
          const isChecked = selected.includes(group.id as TeamPermission);
          const hasChildren = 'children' in group;

          return (
            <div key={group.id} className={`flex flex-col bg-[#FFFFFF] rounded-[16px] p-4 box-border ${hasChildren ? 'gap-4' : ''}`}>
              <div className="flex items-center justify-between h-[26px] w-full">
                <div className="flex items-center gap-3 h-[26px]">
                  <Icon icon={group.icon} className="w-6 h-6 text-[#000000] shrink-0" />
                  <div className="flex items-center h-[26px] text-[16px] font-normal text-[#000000] leading-[26px] font-['Poppins']">
                    {group.label}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(group.id as TeamPermission)}
                  disabled={disabled}
                  className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                    isChecked ? 'bg-[#1A73E8]' : 'bg-[#E0E0E7]'
                  }`}
                >
                  <div
                    className={`absolute top-[2px] w-[20px] h-[20px] bg-[#FFFFFF] rounded-full border border-[#E0E0E7] transition-all ${
                      isChecked ? 'left-[22px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>
              
              {hasChildren && (
                <div className="flex flex-col w-full">
                  {group.children.map((child) => {
                    const isChildChecked = selected.includes(child.id as TeamPermission);
                    // Special functionality for teams: activity log checkbox cannot be activated unless team toggle is on
                    const isChildDisabled = disabled || (group.id === 'teams' && !isChecked);
                    
                    return (
                      <div key={child.id} className={`flex items-center justify-between pl-9 h-[40px] w-full ${isChildDisabled ? 'opacity-50' : ''}`}>
                        <div className="flex items-center h-[26px] text-[16px] text-[#000000] leading-[26px] font-['Poppins']">
                          {child.label}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggle(child.id as TeamPermission)}
                          disabled={isChildDisabled}
                          className="flex items-center justify-center w-[40px] h-[40px] rounded-[100px] p-[11px] hover:bg-gray-50 transition-colors disabled:hover:bg-transparent"
                        >
                          <div className={`box-border w-[18px] h-[18px] rounded-[2px] border flex items-center justify-center transition-colors ${
                            isChildChecked 
                              ? 'bg-[#1A73E8] border-[#1A73E8]' 
                              : 'border-[#6B7280]'
                          } ${isChildDisabled ? 'cursor-not-allowed bg-[#E0E0E7] border-[#E0E0E7]' : ''}`}>
                            {isChildChecked && (
                              <Icon icon="lucide:check" className="w-[14px] h-[14px] text-white" />
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
