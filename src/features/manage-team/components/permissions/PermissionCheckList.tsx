'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import {
  TeamPermission,
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
} from '../../types/team.types';

interface PermissionCheckListProps {
  selected: TeamPermission[];
  onChange: (permissions: TeamPermission[]) => void;
  disabled?: boolean;
}

export default function PermissionCheckList({
  selected,
  onChange,
  disabled,
}: PermissionCheckListProps) {
  const toggle = (perm: TeamPermission) => {
    if (disabled) return;
    if (selected.includes(perm)) {
      onChange(selected.filter((p) => p !== perm));
    } else {
      onChange([...selected, perm]);
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
      {ALL_PERMISSIONS.map((perm) => {
        const isChecked = selected.includes(perm);
        return (
          <button
            key={perm}
            type="button"
            onClick={() => toggle(perm)}
            disabled={disabled}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              disabled
                ? 'cursor-default'
                : 'hover:bg-gray-50 dark:hover:bg-[#1A1D24] cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon
                icon={`lucide:${getPermissionIcon(perm)}`}
                className="w-4 h-4 text-gray-400 dark:text-gray-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-['Poppins']">
                {PERMISSION_LABELS[perm]}
              </span>
            </div>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                isChecked
                  ? 'bg-[#1A73E8] dark:bg-[#4D9CFF]'
                  : 'border-2 border-gray-300 dark:border-gray-600'
              }`}
            >
              {isChecked && (
                <Icon icon="lucide:check" className="w-3.5 h-3.5 text-white" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function getPermissionIcon(perm: TeamPermission): string {
  const iconMap: Record<TeamPermission, string> = {
    create_post: 'plus-square',
    channels: 'tv',
    chat: 'message-circle',
    counter: 'hash',
    teams: 'users',
    activity_logs: 'file-text',
    jobs: 'briefcase',
    jobs_detail: 'clipboard-list',
    analytics: 'bar-chart-3',
  };
  return iconMap[perm] || 'circle';
}
