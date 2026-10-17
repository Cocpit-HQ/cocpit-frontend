'use client';

import React from 'react';
import { Icon } from '@/components/icons';

export default function ActivityLogEmptyState() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-20 gap-2 font-['DM_Sans',sans-serif]">
      <div className="text-center flex flex-col gap-1">
        <p className="font-['DM_Sans',sans-serif] ds-text-body-2 text-ds-text-primary">
          No activity logs to show
        </p>
        <p className="font-['DM_Sans',sans-serif] ds-text-small text-ds-text-muted">
          Activity logs will appear after you create a role and add members to it
        </p>
      </div>
    </div>
  );
}

