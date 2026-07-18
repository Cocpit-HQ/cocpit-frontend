'use client';

import React from 'react';
import { ActivityLogEntry } from '../../types/team.types';
import ActivityLogRow from './ActivityLogRow';
import ActivityLogEmptyState from './ActivityLogEmptyState';

interface ActivityLogTableProps {
  logs: ActivityLogEntry[];
  isLoading?: boolean;
}

export default function ActivityLogTable({
  logs,
  isLoading,
}: ActivityLogTableProps) {
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return <ActivityLogEmptyState />;
  }

  return (
    <div className="w-full flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
      {logs.map((entry) => (
        <ActivityLogRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
