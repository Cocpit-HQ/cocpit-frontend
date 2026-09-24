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
  { id: 'CREATE_POST', label: 'Create post', icon: 'lucide:plus' },
  { id: 'CHANNEL', label: 'Channel', icon: 'quill:inbox-newsletter' },
  { id: 'CHAT', label: 'Chat', icon: 'hugeicons:comment-01' },
  {
    id: 'TEAMS', label: 'Teams', icon: 'streamline-ultimate:team-meeting', children: [
      { id: 'ACTIVITY_LOGS', label: 'Activity logs' }
    ]
  },
  {
    id: 'JOBS', label: 'Jobs', icon: 'hugeicons:job-search', children: [
      { id: 'JOBS_CHAT', label: 'Jobs chat' }
    ]
  },
  { id: 'ANALYTICS', label: 'Analytics', icon: 'hugeicons:analytics-up' },
  { id: 'SETTINGS', label: 'Settings', icon: 'lucide:settings' }
] as const;

export default function PermissionCheckList({
  selected,
  onChange,
  disabled,
}: PermissionCheckListProps) {
  const toggle = (perm: TeamPermission) => {
    if (disabled) return;

    const parentGroup = PERMISSION_GROUPS.find((g) => g.id === perm && 'children' in g);

    if (selected.includes(perm)) {
      let newSelected = selected.filter((p) => p !== perm);
      // When a parent toggle is deactivated, also deactivate all its child permissions
      if (parentGroup && 'children' in parentGroup) {
        const childIds = parentGroup.children.map((c) => c.id as TeamPermission);
        newSelected = newSelected.filter((p) => !childIds.includes(p));
      }
      onChange(newSelected);
    } else {
      let newSelected = [...selected, perm];
      // When any parent toggle is activated, automatically check its child permissions
      if (parentGroup && 'children' in parentGroup) {
        const childIds = parentGroup.children.map((c) => c.id as TeamPermission);
        childIds.forEach((childId) => {
          if (!newSelected.includes(childId)) {
            newSelected.push(childId);
          }
        });
      }
      onChange(newSelected);
    }
  };

  return (
    <div className="flex flex-col p-4 gap-4 bg-[#EFF4FF] dark:bg-[#1A2435] rounded-[24px]">
      <div className="text-[16px] font-semibold text-[#000000] dark:text-[#FFFFFF] leading-[25px] font-['Poppins']">
        Permissions
      </div>
      <div className="flex flex-col gap-4">
        {PERMISSION_GROUPS.map((group) => {
          const isChecked = selected.includes(group.id as TeamPermission);
          const hasChildren = 'children' in group;

          return (
            <div key={group.id} className={`flex flex-col bg-[#FFFFFF] dark:bg-[#0F1115] rounded-[16px] p-4 box-border ${hasChildren ? 'gap-4' : ''}`}>
              <div className="flex items-center justify-between h-[26px] w-full">
                <div className="flex items-center gap-3 h-[26px]">
                  <Icon icon={group.icon} className="w-6 h-6 text-[#000000] dark:text-[#FFFFFF] shrink-0" />
                  <div className="flex items-center h-[26px] text-[16px] font-normal text-[#000000] dark:text-[#FFFFFF] leading-[26px] font-['Poppins']">
                    {group.label}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(group.id as TeamPermission)}
                  disabled={disabled}
                  className={`relative w-[44px] h-[24px] rounded-full transition-colors ${isChecked ? 'bg-[#1A73E8] dark:bg-[#4D9CFF]' : 'bg-[#E0E0E7] dark:bg-[#2A2D35]'
                    }`}
                >
                  <div
                    className={`absolute top-[2px] w-[20px] h-[20px] bg-[#FFFFFF] rounded-full border border-[#E0E0E7] dark:border-[#2A2D35] transition-all ${isChecked ? 'left-[22px]' : 'left-[2px]'
                      }`}
                  />
                </button>
              </div>

              {hasChildren && (
                <div className="flex flex-col w-full">
                  {group.children.map((child) => {
                    const isChildChecked = selected.includes(child.id as TeamPermission);
                    // Child permissions require their parent group toggle to be ON
                    const isChildDisabled = disabled || !isChecked;

                    return (
                      <div key={child.id} className={`flex items-center justify-between pl-9 h-[40px] w-full ${isChildDisabled ? 'opacity-50' : ''}`}>
                        <div className="flex items-center h-[26px] text-[16px] text-[#000000] dark:text-[#A1A8B3] leading-[26px] font-['Poppins']">
                          {child.label}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggle(child.id as TeamPermission)}
                          disabled={isChildDisabled}
                          className="flex items-center justify-center w-[40px] h-[40px] rounded-[100px] p-[11px] hover:bg-gray-50 dark:hover:bg-[#1A2435] transition-colors disabled:hover:bg-transparent"
                        >
                          <div className={`box-border w-[18px] h-[18px] rounded-[2px] border flex items-center justify-center transition-colors ${isChildChecked
                              ? 'bg-[#1A73E8] dark:bg-[#4D9CFF] border-[#1A73E8] dark:border-[#4D9CFF]'
                              : 'border-[#6B7280] dark:border-[#A1A8B3]'
                            } ${isChildDisabled ? 'cursor-default bg-[#E0E0E7] dark:bg-[#2A2D35] border-[#E0E0E7] dark:border-[#2A2D35]' : ''}`}>
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
