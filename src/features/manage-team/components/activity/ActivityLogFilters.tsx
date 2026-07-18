'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { ActivityLogFilters } from '../../types/team.types';
import RoleDropdown from './RoleDropdown';

interface ActivityLogFiltersProps {
  filters: ActivityLogFilters;
  onFiltersChange: (filters: ActivityLogFilters) => void;
  roleOptions: { value: string; label: string }[];
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
  roleOptions,
  memberOptions,
}: ActivityLogFiltersProps) {
  const update = (patch: Partial<ActivityLogFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  return (
    <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F1115] min-w-[180px]">
        <Icon icon="lucide:search" className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder="Search logs"
          className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-['Poppins'] outline-none bg-transparent placeholder:text-gray-300"
        />
      </div>

      {/* Role filter */}
      <RoleDropdown
        options={[{ value: 'all', label: 'All roles' }, ...roleOptions]}
        value={filters.roleId}
        onChange={(v) => update({ roleId: v })}
        placeholder="All roles"
      />

      {/* Member filter */}
      <RoleDropdown
        options={[{ value: 'all', label: 'All members' }, ...memberOptions]}
        value={filters.memberId}
        onChange={(v) => update({ memberId: v })}
        placeholder="All members"
      />

      {/* Date range */}
      <RoleDropdown
        options={DATE_RANGE_OPTIONS}
        value={filters.dateRange}
        onChange={(v) => update({ dateRange: v })}
        placeholder="Date range"
      />
    </div>
  );
}
