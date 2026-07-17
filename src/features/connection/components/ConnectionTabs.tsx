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
    <div className="flex items-center justify-between mb-5">
      <div className="flex gap-2" role="tablist" aria-label="Connection request tabs">
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              id={`conn-tab-${key}`}
              aria-selected={isActive}
              aria-controls={`conn-tabpanel-${key}`}
              className={`inline-flex items-center justify-center px-5 py-2 rounded-[20px] text-sm font-medium transition-all select-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                isActive
                  ? 'bg-[var(--primary-tint)] text-primary border border-transparent'
                : 'bg-card text-primary/70 border border-[#818CF8] hover:bg-[var(--primary-tint)] hover:text-primary'
              }`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button
        role="tab"
        aria-selected={activeTab === 'invitations'}
        onClick={() => setActiveTab('invitations')}
        className={`inline-flex items-center justify-center px-5 py-2 rounded-[20px] text-sm font-medium transition-all select-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          activeTab === 'invitations'
            ? 'bg-[var(--primary-tint)] text-primary border border-transparent'
          : 'bg-card text-primary/70 border border-[#818CF8] hover:bg-[var(--primary-tint)] hover:text-primary'
        }`}
      >
        Invitations
      </button>
    </div>
  );
}
