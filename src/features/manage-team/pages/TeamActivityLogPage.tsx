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

  const queryFilters = React.useMemo(() => ({
    ...filters,
    search: debouncedSearch,
  }), [filters, debouncedSearch]);

  const { logs, isLoading } = useActivityLogs(queryFilters);
  const { members } = useTeamMembers();

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: m.name,
  }));

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Filter bar */}
      <ActivityLogFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        roleOptions={roleOptions}
        memberOptions={memberOptions}
      />

      {/* Log table */}
      <ActivityLogTable logs={logs} isLoading={isLoading} />
    </div>
  );
}
