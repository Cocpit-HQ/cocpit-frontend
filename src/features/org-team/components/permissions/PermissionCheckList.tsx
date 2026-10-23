'use client';

import React from 'react';
import { Icon } from '@/components/icons';
import { Plus } from 'lucide-react';
import { TeamPermission, ALL_PERMISSIONS } from '../../types/team.types';

interface PermissionCheckListProps {
  selected: TeamPermission[];
  onChange: (permissions: TeamPermission[]) => void;
  disabled?: boolean;
}

const DISABLED_PERMISSIONS: TeamPermission[] = ['ANALYTICS', 'JOBS', 'JOBS_CHAT', 'CHAT'];

const PERMISSION_GROUPS = [
  { id: 'CREATE_POST', label: 'Post interactions', icon: 'lucide:plus' },
  { id: 'MANAGE_COMPANY_DETAILS', label: 'Edit company profile', icon: 'business-building' },
  { id: 'CHAT', label: 'Chat', icon: 'chat', disabled: true },
  { id: 'TEAMS', label: 'Teams', icon: 'teams', children: [
    { id: 'ACTIVITY_LOGS', label: 'Activity logs' }
  ]},
  { id: 'JOBS', label: 'Jobs', icon: 'jobs', disabled: true, children: [
    { id: 'JOBS_CHAT', label: 'Jobs chat', disabled: true }
  ]},
  { id: 'ANALYTICS', label: 'Analytics', icon: 'analytics', disabled: true },
  { id: 'SETTINGS', label: 'Settings', icon: 'lucide:settings' }
] as const;

export default function PermissionCheckList({
  selected,
  onChange,
  disabled,
}: PermissionCheckListProps) {
  const toggle = (perm: TeamPermission) => {
    if (disabled || DISABLED_PERMISSIONS.includes(perm)) return;
    
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
      // When any parent toggle is activated, automatically check its non-disabled child permissions
      if (parentGroup && 'children' in parentGroup) {
        const activeChildIds = parentGroup.children
          .filter((c: any) => !c.disabled)
          .map((c) => c.id as TeamPermission);
        activeChildIds.forEach((childId) => {
          if (!newSelected.includes(childId)) {
            newSelected.push(childId);
          }
        });
      }
      onChange(newSelected);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-[16px] leading-[24px] font-semibold text-ds-text-primary font-['DM_Sans',sans-serif]">
          Permissions
        </span>
      </div>
      
      <div className="flex flex-col gap-6 px-0 md:px-4">
        {PERMISSION_GROUPS.map((group) => {
          const isChecked = selected.includes(group.id as TeamPermission);
          const hasChildren = 'children' in group;
          const isGroupDisabled = disabled || Boolean((group as any).disabled);

          return (
            <div key={group.id} className="flex flex-col gap-4">
              <div className={`flex items-center justify-between w-full h-[26px] ${isGroupDisabled ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    {group.id === 'CREATE_POST' ? (
                      <Plus className="w-5 h-5 text-ds-text-primary shrink-0" strokeWidth={1.5} />
                    ) : (
                      <Icon name={group.icon.replace("lucide:", "") as any} className="w-5 h-5 text-ds-text-primary shrink-0" />
                    )}
                  </div>
                  <div className="text-[16px] leading-[24px] font-normal text-ds-text-primary font-['DM_Sans',sans-serif]">
                    {group.label}
                  </div>
                </div>
                
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => toggle(group.id as TeamPermission)}
                  disabled={isGroupDisabled}
                  className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                    isChecked ? 'bg-ds-accent' : 'bg-ds-surface-2'
                  } ${isGroupDisabled ? 'opacity-50 !cursor-default' : ''}`}
                >
                  <div
                    className={`absolute top-[3px] w-[18px] h-[18px] rounded-full transition-all ${
                      isChecked ? 'left-[23px] bg-black' : 'left-[3px] bg-ds-text-secondary'
                    }`}
                  />
                </button>
              </div>
              
              {hasChildren && (
                <div className="flex flex-col w-full gap-4">
                  {group.children.map((child) => {
                    const isChildChecked = selected.includes(child.id as TeamPermission);
                    const isChildDisabled = disabled || !isChecked || Boolean((child as any).disabled) || isGroupDisabled;
                    
                    return (
                      <div key={child.id} className={`flex items-center justify-between pl-[36px] w-full h-[26px] ${isChildDisabled ? 'opacity-50' : ''}`}>
                        <div className="text-[16px] leading-[24px] font-normal text-ds-text-primary font-['DM_Sans',sans-serif]">
                          {child.label}
                        </div>
                        
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggle(child.id as TeamPermission)}
                          disabled={isChildDisabled}
                          className={`flex items-center justify-center w-[24px] h-[24px] rounded-[4px] transition-colors border ${
                            isChildChecked ? 'bg-ds-accent border-ds-accent' : 'bg-ds-surface-1 border-ds-border'
                          } ${isChildDisabled ? '!cursor-default' : ''}`}
                        >
                          {isChildChecked && (
                            <Icon name="check" className="w-[14px] h-[14px] text-white" />
                          )}
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

