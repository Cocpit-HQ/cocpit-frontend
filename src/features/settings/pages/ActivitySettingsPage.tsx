"use client";

import React, { useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, ChevronLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSettingsStore, type ActivityTab } from '@/store/settings.store';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import {
  LikesActivityTab,
  CommentsActivityTab,
  TagsActivityTab,
} from '../components/activity';

const TABS: { key: ActivityTab; label: string }[] = [
  { key: 'Likes', label: 'Like' },
  { key: 'Comments', label: 'Comments' },
  { key: 'Tags', label: 'Tags' },
];

export function ActivitySettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/activity';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const { isCompany, activeProfile } = useActiveProfile();
  const companyId = isCompany ? activeProfile?.id : undefined;
  const queryClient = useQueryClient();
  const activeTab = useSettingsStore((state) => state.activity.activeTab);
  const setActiveTab = useSettingsStore((state) => state.setActivityTab);

  const { data, isLoading, isError, removeActivity } = useActivityLogs(activeTab, companyId);

  // Local state for removed items in current session
  const [removedItemIds, setRemovedItemIds] = useState<Set<string | number>>(new Set());

  React.useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['activityLogs'] });
    };
    window.addEventListener('cocpit:activity-updated', handleRefresh);
    return () => window.removeEventListener('cocpit:activity-updated', handleRefresh);
  }, [queryClient]);

  const handleRemove = useCallback(
    (e: React.MouseEvent, id: number | string, postId?: string) => {
      e.stopPropagation();
      setRemovedItemIds((prev) => new Set(prev).add(id));
      removeActivity({ id, postId });
    },
    [removeActivity]
  );

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Always reset scroll position to top (scrollTop = 0) whenever activeTab changes
  React.useLayoutEffect(() => {
    const mainEl = scrollContainerRef.current?.closest('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <div className="w-full max-w-[712px] flex flex-col justify-start items-start select-none">
      {/* ─── Horizontal Tabs (Fixed Header) ─── */}
      <div className="sticky top-0 w-full shrink-0 px-2 sm:px-4 py-2 flex justify-between items-center bg-ds-bg z-30">
        <div className="flex justify-start items-center gap-2 sm:gap-3" role="tablist">
          <button
            type="button"
            onClick={() => router.replace(basePath)}
            aria-label="Back to settings menu"
            className="flex md:hidden items-center justify-center w-5 h-5 p-0 text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer shrink-0 mr-2"
          >
            <ChevronLeft className="w-5 h-5 text-ds-text-primary stroke-[1.5]" />
          </button>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setActiveTab(tab.key);
                  const mainEl = scrollContainerRef.current?.closest('main');
                  if (mainEl) {
                    mainEl.scrollTo({ top: 0, behavior: 'instant' });
                  }
                }}
                className="inline-flex flex-col justify-start items-center cursor-pointer bg-transparent border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm"
              >
                <div className="self-stretch px-4 py-1.5 flex flex-col justify-center items-center gap-2">
                  <span
                    className={`ds-text-body-1 transition-colors ${
                      isSelected ? 'text-ds-text-primary' : 'text-ds-text-secondary hover:text-ds-text-primary'
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="self-stretch h-[2px] bg-ds-accent rounded-full transition-all" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Activity Content Pane ─── */}
      <div
        ref={scrollContainerRef}
        key={activeTab}
        className="w-full px-4 py-3 flex flex-col gap-6"
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-20 w-full">
            <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center w-full">
            <p className="ds-text-secondary text-ds-error">
              Failed to load activity. Please try again.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'Likes' && (
              <LikesActivityTab
                data={data}
                removedItemIds={removedItemIds}
                onRemove={handleRemove}
              />
            )}

            {activeTab === 'Comments' && (
              <CommentsActivityTab
                data={data}
                removedItemIds={removedItemIds}
                onRemove={handleRemove}
              />
            )}

            {activeTab === 'Tags' && (
              <TagsActivityTab
                data={data}
                removedItemIds={removedItemIds}
                onRemove={handleRemove}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
export default ActivitySettingsPage;
