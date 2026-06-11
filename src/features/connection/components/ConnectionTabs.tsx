'use client';

import { useConnectionStore } from '@/store/connection.store';
import type { ConnectionTab } from '../types';

const TABS: { key: ConnectionTab; label: string }[] = [
  { key: 'received', label: 'Received' },
  { key: 'sent',     label: 'Sent' },
];

export function ConnectionTabs() {
  const { activeTab, setActiveTab } = useConnectionStore();

  return (
    <div className="conn-tabs" role="tablist" aria-label="Connection request tabs">
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            role="tab"
            id={`conn-tab-${key}`}
            aria-selected={isActive}
            aria-controls={`conn-tabpanel-${key}`}
            className={`conn-tab ${isActive ? 'conn-tab--active' : 'conn-tab--inactive'}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
