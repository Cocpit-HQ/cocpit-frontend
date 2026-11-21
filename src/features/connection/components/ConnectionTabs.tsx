'use client';

import React from 'react';
import { useConnectionStore } from '@/store/connection.store';
import { useConnectionCounts } from '../hooks/useConnectionCounts';
import type { ConnectionTab } from '../types';
import { UnderlineTabs, TabItem } from '@/components/ui/UnderlineTabs';

const BASE_TABS: { key: ConnectionTab; label: string }[] = [
  { key: 'received', label: 'Received' },
  { key: 'sent', label: 'Sent' },
  { key: 'invitations', label: 'Invitation' },
];

interface ConnectionTabsProps {
  activeCount?: number;
}

export function ConnectionTabs({ activeCount }: ConnectionTabsProps) {
  const { activeTab, setActiveTab } = useConnectionStore();
  const { data: counts } = useConnectionCounts();

  const tabs: TabItem<ConnectionTab>[] = BASE_TABS.map(({ key, label }) => {
    const isActive = activeTab === key;
    const fallbackCount =
      key === 'received'
        ? counts?.received ?? 0
        : key === 'sent'
        ? counts?.sent ?? 0
        : counts?.teamsInvitations ?? 0;

    const count = isActive && typeof activeCount === 'number' ? activeCount : fallbackCount;
    const hasPending = count > 0;

    return {
      id: key,
      label,
      badge: hasPending,
    };
  });

  return (
    <div className="w-full border-b border-ds-border/60 pb-0 mb-5">
      <UnderlineTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        tablistAriaLabel="Connection request tabs"
      />
    </div>
  );
}
export default ConnectionTabs;
