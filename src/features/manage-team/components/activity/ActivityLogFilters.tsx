'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { ActivityLogFilters } from '../../types/team.types';
import RoleDropdown from './RoleDropdown';

interface ActivityLogFiltersProps {
  filters: ActivityLogFilters;
  onFiltersChange: (filters: ActivityLogFilters) => void;
  roleOptions?: { value: string; label: string }[];
  memberOptions: { value: string; label: string }[];
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
}: ActivityLogFiltersProps) {
  const update = (patch: Partial<ActivityLogFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  return (
    <div className="w-full flex flex-row items-start gap-6 max-w-[960px]">
      {/* Search logs */}
      <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
        <span className="text-[14px] font-medium text-[#000000] dark:text-white font-['Poppins'] tracking-[0.14px]">
          Search logs
        </span>
        <div className="flex items-center gap-2 px-6 h-[50px] rounded-[24px] border border-[#E0E0E7] dark:border-gray-700 bg-transparent w-full box-border">
          <Icon icon="lucide:search" className="w-5 h-5 text-black dark:text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search..."
            className="flex-1 text-[16px] text-[#000000] dark:text-gray-200 font-['Poppins'] outline-none bg-transparent placeholder:text-[#6B7280]"
          />
        </div>
      </div>

      {/* Role */}
      <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
        <span className="text-[14px] font-medium text-[#000000] dark:text-white font-['Poppins'] tracking-[0.14px]">
          Role
        </span>
        <RoleDropdown
          options={[{ value: 'all', label: 'All roles' }, ...roleOptions]}
          value={filters.roleId}
          onChange={(v) => update({ roleId: v })}
          placeholder="All roles"
        />
      </div>

      {/* Member */}
      <div className="flex flex-col items-start gap-2 flex-1 max-w-[304px]">
        <span className="text-[14px] font-medium text-[#000000] dark:text-white font-['Poppins'] tracking-[0.14px]">
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
        <span className="text-[14px] font-medium text-[#000000] dark:text-white font-['Poppins'] tracking-[0.14px]">
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
