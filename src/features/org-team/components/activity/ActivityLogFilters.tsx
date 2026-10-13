'use client';

import React from 'react';
import { Icon } from '@/components/icons';
import { ActivityLogFilters } from '../../types/team.types';
import RoleDropdown from './RoleDropdown';

interface ActivityLogFiltersProps {
  filters: ActivityLogFilters;
  onFiltersChange: (filters: ActivityLogFilters) => void;
  roleOptions?: { value: string; label: string }[];
  memberOptions: { value: string; label: string }[];
  hideRoleDropdown?: boolean;
  variant?: 'default' | 'compact';
}

const DATE_RANGE_OPTIONS = [
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_90_days', label: 'Last 90 days' },
  { value: 'all_time', label: 'All time' },
];

export default function ActivityLogFiltersBar({
  filters,
  onFiltersChange,
  memberOptions,
  roleOptions = [],
  hideRoleDropdown = false,
  variant = 'default',
}: ActivityLogFiltersProps) {
  const update = (patch: Partial<ActivityLogFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  if (variant === 'compact') {
    return (
      <div className="flex flex-row items-center p-0 gap-[16px] w-full max-w-[800px] h-[40px] mb-2">
        <div className="box-border flex flex-row justify-between items-center px-[12px] py-[6px] gap-[10px] flex-1 h-[40px] border-b border-ds-text-primary">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search"
            className="flex-1 font-['DM_Sans'] font-normal text-[16px] leading-[24px] text-ds-text-primary bg-transparent outline-none placeholder:text-ds-text-muted text-left"
          />
          <Icon name="search" className="w-[20px] h-[20px] text-ds-text-primary" />
        </div>
        <div className="flex items-center gap-[16px] shrink-0">
          {!hideRoleDropdown && (
            <RoleDropdown
              options={[{ value: 'all', label: 'All roles' }, ...roleOptions]}
              value={filters.roleId}
              onChange={(v) => update({ roleId: v })}
              placeholder="All roles"
              variant="pill"
            />
          )}
          <RoleDropdown
            options={[{ value: 'all', label: 'All members' }, ...memberOptions]}
            value={filters.memberId}
            onChange={(v) => update({ memberId: v })}
            placeholder="All members"
            variant="pill"
          />
          <RoleDropdown
            options={DATE_RANGE_OPTIONS}
            value={filters.dateRange}
            onChange={(v) => update({ dateRange: v })}
            placeholder="Last 7 days"
            variant="pill"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-row items-start gap-6 max-w-[960px] sticky top-[72px] z-20 bg-ds-bg pt-2.5 pb-3">
      {/* Search logs */}
      <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
        <span className="ds-text-secondary-1 text-ds-text-primary tracking-[0.14px]">
          Search logs
        </span>
        <div className="flex items-center gap-2 px-6 h-[50px] rounded-[24px] border border-ds-border bg-transparent w-full box-border">
          <Icon name="search" className="ds-icon-16 text-ds-text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search..."
            className="flex-1 ds-text-body text-ds-text-primary outline-none bg-transparent placeholder:text-ds-text-muted"
          />
        </div>
      </div>

      {/* Role */}
      {!hideRoleDropdown && (
        <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
          <span className="ds-text-secondary-1 text-ds-text-primary tracking-[0.14px]">
            Role
          </span>
          <RoleDropdown
            options={[{ value: 'all', label: 'All roles' }, ...roleOptions]}
            value={filters.roleId}
            onChange={(v) => update({ roleId: v })}
            placeholder="All roles"
          />
        </div>
      )}

      {/* Member */}
      <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
        <span className="ds-text-secondary-1 text-ds-text-primary tracking-[0.14px]">
          Member
        </span>
        <RoleDropdown
          options={[{ value: 'all', label: 'All members' }, ...memberOptions]}
          value={filters.memberId}
          onChange={(v) => update({ memberId: v })}
          placeholder="All members"
        />
      </div>

      {/* Date range */}
      <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
        <span className="ds-text-secondary-1 text-ds-text-primary tracking-[0.14px]">
          Date range
        </span>
        <RoleDropdown
          options={DATE_RANGE_OPTIONS}
          value={filters.dateRange}
          onChange={(v) => update({ dateRange: v })}
          placeholder="Date range"
        />
      </div>
    </div>
  );
}

