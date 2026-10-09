'use client';

import React from 'react';
import { useConnectionStore } from '@/store/connection.store';
import { useConnectionCounts } from '../hooks/useConnectionCounts';
import type { ConnectionTab } from '../types';

const TABS: { key: ConnectionTab; label: string }[] = [
  { key: 'received', label: 'Received' },
  { key: 'sent', label: 'Sent' },
  { key: 'invitations', label: 'Invitation' },
];

interface ConnectionTabsProps {
  activeCount?: number;
}

export function ConnectionTabs({ activeCount }: ConnectionTabsProps) {
  const { activeTab, setActiveTab, invitationSubTab } = useConnectionStore();
  const { data: counts } = useConnectionCounts();

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % TABS.length;
      setActiveTab(TABS[nextIndex].key);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + TABS.length) % TABS.length;
      setActiveTab(TABS[prevIndex].key);
    }
  };

  return (
    <div className="w-full h-9 flex items-center gap-3 border-b border-ds-border/60 pb-0 mb-5 select-none font-dm-sans overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div
        role="tablist"
        aria-label="Connection request tabs"
        className="w-full h-9 flex items-center gap-3"
      >
        {TABS.map(({ key, label }, index) => {
          const isActive = activeTab === key;
          const fallbackCount =
            key === 'received'
              ? counts?.received ?? 0
              : key === 'sent'
              ? counts?.sent ?? 0
              : counts?.teamsInvitations ?? 0;

          const count = isActive && typeof activeCount === 'number' ? activeCount : fallbackCount;
          // Fix: Display the pending indicator when count > 0, even for the active tab
          const hasPending = count > 0;

          return (
            <button
              key={key}
              role="tab"
              id={`conn-tab-${key}`}
              aria-selected={isActive}
              aria-controls={`conn-tabpanel-${key}`}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={() => setActiveTab(key)}
              className={`relative h-9 px-3 py-1.5 flex flex-col items-center justify-center text-[16px] leading-6 font-medium transition-colors outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm ${
                isActive
                  ? 'text-ds-text-primary'
                  : 'text-ds-text-secondary hover:text-ds-text-primary'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {hasPending && (
                  <span
                    className="w-[4px] h-[4px] rounded-full bg-ds-accent shrink-0 inline-block"
                    style={{
                      boxShadow:
                        '-1px -1px 4px rgba(255, 236, 230, 0.4), 1px 1px 4px rgba(255, 236, 230, 0.4)',
                    }}
                    aria-hidden="true"
                  />
                )}
                <span>{label}</span>
              </div>
              {isActive && (
                <span
                  className="absolute bottom-0 inset-x-0 h-[1.5px] bg-ds-accent"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default ConnectionTabs;
