'use client';

import { useConnectionStore } from '@/store/connection.store';
import { useConnectionCounts } from '../hooks/useConnectionCounts';
import type { ConnectionTab } from '../types';

const TABS: { key: ConnectionTab; label: string }[] = [
  { key: 'received', label: 'Received' },
  { key: 'sent',     label: 'Sent' },
];

export function ConnectionTabs() {
  const { activeTab, setActiveTab } = useConnectionStore();
  const { data: counts } = useConnectionCounts();

  const invitationsCount = counts?.invitations ?? 0;

  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex gap-2" role="tablist" aria-label="Connection request tabs">
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          const count = key === 'received' ? counts?.received ?? 0 : counts?.sent ?? 0;
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
              <span>{label}</span>
              {count > 0 && (
                <span className="ml-2 w-[6px] h-[6px] rounded-full bg-[#6366F1] shadow-[0_0_6px_rgba(99,102,241,0.8)] shrink-0 inline-block" />
              )}
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
        <span>Invitations</span>
        {invitationsCount > 0 && (
          <span className="ml-2 w-[6px] h-[6px] rounded-full bg-[#6366F1] shadow-[0_0_6px_rgba(99,102,241,0.8)] shrink-0 inline-block" />
        )}
      </button>
    </div>
  );
}
