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
import { RemoveTagModal } from '../components/modals/RemoveTagModal';

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

  const { isCompany, activeProfile, userCompanies } = useActiveProfile();

  // Robust organization resolution:
  // 1. If pathname is /organization/[slug]/settings/..., extract the slug
  const orgMatch = pathname.match(/\/organization\/([^/]+)/);
  const orgSlug = orgMatch ? orgMatch[1] : null;

  // 2. Resolve company ID from userCompanies if slug matches, or fallback to activeProfile/orgSlug
  const currentOrg = orgSlug
    ? userCompanies?.find((c) => c.slug === orgSlug || c.company_id === orgSlug || (c as any).org_id === orgSlug)
    : null;
  const companyId = currentOrg
    ? (currentOrg.company_id || (currentOrg as any).org_id)
    : (orgSlug || (isCompany ? activeProfile?.id : undefined));
  const queryClient = useQueryClient();
  const activeTab = useSettingsStore((state) => state.activity.activeTab);
  const setActiveTab = useSettingsStore((state) => state.setActivityTab);

  const { data, isLoading, isError, removeActivity } = useActivityLogs(activeTab, companyId);

  // Local state for removed items in current session
  const [removedItemIds, setRemovedItemIds] = useState<Set<string | number>>(new Set());

  // State for tag removal confirmation popup
  const [tagToRemove, setTagToRemove] = useState<{ id: number | string; postId?: string } | null>(null);

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
      if (activeTab === 'Tags') {
        setTagToRemove({ id, postId });
      } else {
        setRemovedItemIds((prev) => new Set(prev).add(id));
        removeActivity({ id, postId });
      }
    },
    [activeTab, removeActivity]
  );

  const handleConfirmRemoveTag = useCallback(() => {
    if (!tagToRemove) return;
    setRemovedItemIds((prev) => new Set(prev).add(tagToRemove.id));
    removeActivity({ id: tagToRemove.id, postId: tagToRemove.postId });
    setTagToRemove(null);
  }, [tagToRemove, removeActivity]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const prevTabRef = React.useRef(activeTab);

  // Reset scroll to top ONLY when activeTab actually changes, never on initial mount
  React.useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      const mainEl =
        scrollContainerRef.current?.closest('main') ||
        document.getElementById('settings-main-scroll-container');
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
    }
  }, [activeTab]);

  // Continuously record scroll position on the main settings scroll container (debounced)
  React.useEffect(() => {
    const mainEl =
      scrollContainerRef.current?.closest('main') ||
      document.getElementById('settings-main-scroll-container');
    if (!mainEl) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      const currentScroll = mainEl.scrollTop;
      if (currentScroll === 0 && sessionStorage.getItem(`scroll-${pathname}`) !== '0') {
        return;
      }
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(`scroll-${pathname}`, currentScroll.toString());
        sessionStorage.setItem('cocpit_activity_scroll_y', currentScroll.toString());
      }, 100);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  // Restore previous scroll position when returning from Single Post View (Back or Close)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedScroll =
      sessionStorage.getItem(`scroll-${pathname}`) ||
      sessionStorage.getItem('cocpit_activity_scroll_y') ||
      sessionStorage.getItem('cocpit_scroll_y');

    if (!savedScroll || savedScroll === '0') return;

    const targetScroll = parseInt(savedScroll, 10);
    if (isNaN(targetScroll) || targetScroll <= 0) return;

    const lastPostId = sessionStorage.getItem('cocpit_last_interacted_post_id');
    const lastViewportTopStr = sessionStorage.getItem('cocpit_last_interacted_post_viewport_top');
    const lastViewportTop = lastViewportTopStr ? parseFloat(lastViewportTopStr) : null;

    let retries = 0;
    const maxRetries = 60; // 60 frames = ~1000ms
    let animationFrameId: number;

    const attemptScroll = () => {
      const mainEl =
        scrollContainerRef.current?.closest('main') ||
        document.getElementById('settings-main-scroll-container') ||
        (document.querySelector('.settings-page-wrapper main') as HTMLElement | null);

      if (!mainEl) {
        if (retries < maxRetries) {
          retries++;
          animationFrameId = requestAnimationFrame(attemptScroll);
        }
        return;
      }

      // If data is still loading or container hasn't expanded with content, keep waiting
      if (isLoading || mainEl.scrollHeight <= mainEl.clientHeight) {
        if (retries < maxRetries) {
          retries++;
          animationFrameId = requestAnimationFrame(attemptScroll);
        }
        return;
      }

      const targetEl = lastPostId
        ? (document.getElementById(`post-${lastPostId}`) ||
           document.querySelector(`[data-post-id="${lastPostId}"]`))
        : null;

      let scrollPos = targetScroll;
      if (targetEl && lastViewportTop !== null) {
        const containerTop = mainEl.getBoundingClientRect().top;
        const currentElTop = targetEl.getBoundingClientRect().top - containerTop;
        scrollPos = Math.max(0, mainEl.scrollTop + currentElTop - lastViewportTop);
      }

      mainEl.scrollTo({ top: scrollPos, behavior: 'instant' });

      const maxScrollTop = mainEl.scrollHeight - mainEl.clientHeight;
      const expectedScroll = Math.min(scrollPos, maxScrollTop);
      if (Math.abs(mainEl.scrollTop - expectedScroll) < 10 || retries >= maxRetries) {
        setTimeout(() => {
          sessionStorage.removeItem('cocpit_activity_scroll_y');
          sessionStorage.removeItem('cocpit_last_interacted_post_id');
          sessionStorage.removeItem('cocpit_last_interacted_post_viewport_top');
          sessionStorage.removeItem(`scroll-${pathname}`);
        }, 300);
        return;
      }

      retries++;
      animationFrameId = requestAnimationFrame(attemptScroll);
    };

    animationFrameId = requestAnimationFrame(attemptScroll);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [pathname, isLoading, data]);

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
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem(`scroll-${pathname}`, '0');
                    sessionStorage.removeItem('cocpit_activity_scroll_y');
                    sessionStorage.removeItem('cocpit_last_interacted_post_id');
                  }
                  const mainEl = scrollContainerRef.current?.closest('main') || document.getElementById('settings-main-scroll-container');
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

      <RemoveTagModal
        isOpen={!!tagToRemove}
        onClose={() => setTagToRemove(null)}
        onConfirm={handleConfirmRemoveTag}
      />
    </div>
  );
}
export default ActivitySettingsPage;
