'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { useConnectionStore } from '@/store/connection.store';
import { useConnectionRequests }   from './hooks/useConnectionRequests';
import { useConnectionCounts }     from './hooks/useConnectionCounts';
import type { ConnectionTab, InvitationSubTab } from './types';

import { ConnectionHeader }   from './components/ConnectionHeader';
import { ConnectionTabs }     from './components/ConnectionTabs';
import { InboxCounter }       from './components/InboxCounter';
import { RequestList }        from './components/RequestList';
import { SeeAllLink }         from './components/SeeAllLink';
import { SuggestionsGrid }    from './components/SuggestionsGrid';
import { EmptyState }         from './components/EmptyState';
import { ErrorState }         from './components/ErrorState';
import { RequestCardSkeleton } from './components/skeletons/RequestCardSkeleton';

// ── Empty state text per tab ──────────────────────────────────────────────────
const EMPTY_STATE = {
  received: {
    title:    'No Incoming Requests',
    subtitle: 'When someone sends you a connection request, it will appear here.',
  },
  sent: {
    title:    'No Sent Requests',
    subtitle: 'Connect with people you know to grow your network.',
  },
} as const;

type ConnectionPageView = 'main' | 'expanded';

interface ConnectionPageProps {
  /** 
   * main     → shows first 3 cards + See All link + Suggestions section
   * expanded → shows all cards + back header, no suggestions
   */
  view?: ConnectionPageView;
  initialTab?: 'received' | 'sent';
}

export function ConnectionPage({ view = 'main', initialTab }: ConnectionPageProps) {
  const { activeTab, setActiveTab, invitationSubTab, setInvitationSubTab, removedRequestIds } = useConnectionStore();
  const isExpanded    = view === 'expanded';

  // Read URL search params on mount (e.g. /connections?tab=invitations&sub=channels
  // emitted by notification click) and activate the corresponding tab/sub-tab.
  // Only runs once on mount — subsequent tab switches use the store directly.
  const searchParams = useSearchParams();
  useEffect(() => {
    const urlTab = searchParams.get('tab') as ConnectionTab | null;
    const urlSub = searchParams.get('sub') as InvitationSubTab | null;
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
    if (urlSub && urlSub !== invitationSubTab) {
      setInvitationSubTab(urlSub);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount only

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, activeTab, setActiveTab]);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useConnectionRequests(activeTab, invitationSubTab);

  const { data: counts } = useConnectionCounts();

  const rawRequests     = data?.data ?? [];
  const allRequests     = rawRequests.filter((r) => !removedRequestIds.includes(r.id));
  const totalCount      = Math.max(0, (data?.totalCount ?? 0) - removedRequestIds.length);
  const previewLimit    = isExpanded ? allRequests.length : 3;
  const displayRequests = allRequests.slice(0, previewLimit);

  // Which inbox count to show for active tab — prioritize actual fetched list totalCount when data is ready
  const activeTabCount = activeTab === 'received'
    ? (counts?.received ?? 0)
    : activeTab === 'sent'
      ? (counts?.sent ?? 0)
      : (counts?.invitations ?? 0);

  const inboxCount = data ? totalCount : activeTabCount;

  // Render decision
  const showSkeleton  = isLoading;
  const showError     = !isLoading && isError;
  const showEmpty     = !isLoading && !isError && allRequests.length === 0;
  const showContent   = !isLoading && !isError && allRequests.length > 0;

  // Suggestions: shown on both tabs in main view, but hidden on invitations
  const showSuggestions = !isExpanded && activeTab !== 'invitations';

  let emptyTitle = '';
  let emptySubtitle = '';
  if (activeTab === 'invitations') {
    if (invitationSubTab === 'teams') {
      emptyTitle = 'No team invitations';
      emptySubtitle = "You haven't received any team invitations";
    } else {
      emptyTitle = 'No channel invitations';
      emptySubtitle = "You haven't received any channel invitations";
    }
  } else {
    const validTab = activeTab as 'received' | 'sent';
    emptyTitle = EMPTY_STATE[validTab].title;
    emptySubtitle = EMPTY_STATE[validTab].subtitle;
  }

  return (
    <main className="min-h-screen bg-background px-4 sm:px-5 py-4 sm:py-6">
      <div className="mx-auto max-w-[960px]">

        {/* Back header — only in expanded view */}
        {isExpanded && <ConnectionHeader />}

        {/* Tabs + Inbox counter */}
        {!isExpanded && <ConnectionTabs />}

        {!isExpanded && activeTab === 'invitations' && (
          <div className="flex gap-6 mb-5">
            <button
              onClick={() => setInvitationSubTab('teams')}
              className={`pb-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                invitationSubTab === 'teams'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              <span>Teams</span>
              {(counts?.teamsInvitations ?? 0) > 0 && (
                <span className="w-[6px] h-[6px] rounded-full bg-[#6366F1] shadow-[0_0_6px_rgba(99,102,241,0.8)] shrink-0 inline-block" />
              )}
            </button>
            <button
              onClick={() => setInvitationSubTab('channels')}
              className={`pb-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                invitationSubTab === 'channels'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              <span>Channels</span>
              {(counts?.channelsInvitations ?? 0) > 0 && (
                <span className="w-[6px] h-[6px] rounded-full bg-[#6366F1] shadow-[0_0_6px_rgba(99,102,241,0.8)] shrink-0 inline-block" />
              )}
            </button>
          </div>
        )}

        <InboxCounter count={isLoading ? 0 : inboxCount} />

        {/* ── Content area ── */}
        <div
          id={`conn-tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`conn-tab-${activeTab}`}
          aria-live="polite"
        >
          {/* Loading skeletons */}
          {showSkeleton && (
            <div className="flex flex-col bg-transparent">
              <RequestCardSkeleton />
              <RequestCardSkeleton />
              <RequestCardSkeleton />
            </div>
          )}

          {/* Error */}
          {showError && (
            <ErrorState
              title="Unable to Load"
              subtitle={`We couldn't load your ${activeTab} requests. Please try again.`}
              onRetry={() => refetch()}
            />
          )}

          {/* Empty */}
          {showEmpty && (
            <EmptyState
              title={emptyTitle}
              subtitle={emptySubtitle}
            />
          )}

          {/* Request cards */}
          {showContent && (
            <div className="flex flex-col bg-card">
              <RequestList
                requests={displayRequests}
                mode={activeTab}
                subTab={invitationSubTab}
              />

              {/* See All — full-width bottom bar, only in main view when we have > 3 */}
              {!isExpanded && (
                <SeeAllLink count={totalCount} href={`/connections/${activeTab}`} />
              )}
            </div>
          )}
        </div>

        {/* ── Suggestions section ── */}
        <SuggestionsGrid enabled={showSuggestions} />

      </div>
    </main>
  );
}
