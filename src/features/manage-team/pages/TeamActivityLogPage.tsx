'use client';

import React, { useState } from 'react';
import { TeamRole, ActivityLogFilters } from '../types/team.types';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useTeamMembers } from '../hooks/useTeamMembers';
import ActivityLogFiltersBar from '../components/activity/ActivityLogFilters';
import ActivityLogTable from '../components/activity/ActivityLogTable';
import { useDebounce } from '@/hooks/use-debounce';

interface TeamActivityLogPageProps {
  roles: TeamRole[];
}

export default function TeamActivityLogPage({ roles }: TeamActivityLogPageProps) {
  const [filters, setFilters] = useState<ActivityLogFilters>({
    search: '',
    roleId: 'all',
    memberId: 'all',
    dateRange: 'last_7_days',
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const effectiveSearch = React.useMemo(() => {
    const trimmed = (debouncedSearch || '').trim();
    return trimmed.length >= 3 ? trimmed : '';
  }, [debouncedSearch]);

  const queryFilters = React.useMemo(() => ({
    ...filters,
    search: effectiveSearch,
  }), [filters, effectiveSearch]);

  const { logs, isLoading, isFetchingMore, hasMore, loadMore } = useActivityLogs(queryFilters);
  const { members } = useTeamMembers();

  // Filter to active members only (excluding invited / pending / suspended)
  const activeMembers = React.useMemo(() => {
    return members.filter((m) => m.status === 'ACTIVE');
  }, [members]);

  // Cascading logic: Filter active member dropdown options by selected roleId
  const filteredMembers = React.useMemo(() => {
    if (!filters.roleId || filters.roleId === 'all') {
      return activeMembers;
    }
    return activeMembers.filter((m) => m.roleId === filters.roleId);
  }, [activeMembers, filters.roleId]);

  const roleOptions = React.useMemo(() => roles.map((r) => ({
    value: r.id,
    label: r.name,
  })), [roles]);

  const memberOptions = React.useMemo(() => filteredMembers.map((m) => ({
    value: m.id,
    label: m.name,
  })), [filteredMembers]);

  const handleFiltersChange = (newFilters: ActivityLogFilters) => {
    // Whenever role changes, always reset member selection to 'all'
    if (newFilters.roleId !== filters.roleId) {
      newFilters.memberId = 'all';
    }
    setFilters(newFilters);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Filter bar */}
      <ActivityLogFiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        roleOptions={roleOptions}
        memberOptions={memberOptions}
      />

      {/* Log table */}
      <ActivityLogTable
        logs={logs}
        isLoading={isLoading}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        loadMore={loadMore}
      />
    </div>
  );
}
