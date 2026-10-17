'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { useConnectionStore } from '@/store/connection.store';
import { useConnectionRequests } from './hooks/useConnectionRequests';
import { useConnectionCounts } from './hooks/useConnectionCounts';
import { useConnectionActions } from './hooks/useConnectionActions';
import type { ConnectionTab, InvitationSubTab } from './types';

import { ConnectionHeader } from './components/ConnectionHeader';
import { ConnectionTabs } from './components/ConnectionTabs';
import { RequestList } from './components/RequestList';
import { SeeAllLink } from './components/SeeAllLink';
import { SuggestionsGrid } from './components/SuggestionsGrid';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { RequestCardSkeleton } from './components/skeletons/RequestCardSkeleton';
import { useFeatureFlags } from '@/context/FeatureFlagContext';
import {
  ConnectionConfirmModal,
  ConnectionConfirmType,
} from './components/ConnectionConfirmModal';

// ── Empty state text per tab ──────────────────────────────────────────────────
const EMPTY_STATE = {
  received: {
    title: 'No pending invitations',
    subtitle: "You don't have any connection requests right now",
  },
  sent: {
    title: 'No sent invitations',
    subtitle: 'Connection requests you send will appear here',
  },
} as const;

type ConnectionPageView = 'main' | 'expanded';

interface ConnectionPageProps {
  /**
   * main     → shows first 3 cards + See All link + Suggestions section
   * expanded → shows all cards + back header, no suggestions
   */
  view?: ConnectionPageView;
  initialTab?: 'received' | 'sent' | 'invitations';
}

export function ConnectionPage({ view = 'main', initialTab }: ConnectionPageProps) {
  const { flags } = useFeatureFlags();
  const {
    activeTab,
    setActiveTab,
    invitationSubTab,
    setInvitationSubTab,
    removedRequestIds,
    restoreRequests,
  } = useConnectionStore();
  const isExpanded = view === 'expanded';

  const [confirmModalType, setConfirmModalType] = useState<ConnectionConfirmType | null>(null);

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
  }, []);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, activeTab, setActiveTab]);

  const { data, isLoading, isError, refetch } = useConnectionRequests(
    activeTab,
    invitationSubTab
  );

  // Clear IDs from removedRequestIds once they are no longer in the server response
  useEffect(() => {
    if (!data?.data || removedRequestIds.length === 0) return;
    const currentIds = new Set(data.data.map((r) => r.id));
    const staleIds = removedRequestIds.filter((id) => !currentIds.has(id));
    if (staleIds.length > 0) {
      restoreRequests(staleIds);
    }
  }, [data?.data, removedRequestIds, restoreRequests]);

  const { data: counts } = useConnectionCounts();
  const {
    batchAccept,
    batchDecline,
    batchWithdraw,
    batchDeclineInvitations,
  } = useConnectionActions();

  const rawRequests = data?.data ?? [];
  const pendingRemovals = rawRequests.filter((r) => removedRequestIds.includes(r.id)).length;
  const allRequests = rawRequests.filter((r) => !removedRequestIds.includes(r.id));

  // Which inbox count to show for active tab
  const activeTabCount =
    activeTab === 'received'
      ? counts?.received ?? 0
      : activeTab === 'sent'
      ? counts?.sent ?? 0
      : counts?.teamsInvitations ?? 0;

  const baseCount =
    typeof data?.totalCount === 'number' && data.totalCount > 0
      ? data.totalCount
      : activeTabCount > 0
      ? activeTabCount
      : rawRequests.length;
  const totalCount = Math.max(0, baseCount - pendingRemovals);
  const previewLimit = isExpanded ? allRequests.length : 3;
  const displayRequests = allRequests.slice(0, previewLimit);

  const inboxCount = data ? totalCount : activeTabCount;

  // Render decisions
  const showSkeleton = isLoading;
  const showError = !isLoading && isError;
  const showEmpty = !isLoading && !isError && allRequests.length === 0;
  const showContent = !isLoading && !isError && allRequests.length > 0;

  // Suggestions: shown on both tabs in main view, but hidden on invitations
  const showSuggestions = (flags?.enableConnectionSuggestions ?? true) && (!isExpanded && activeTab !== 'invitations');

  let emptyTitle = '';
  let emptySubtitle = '';
  if (activeTab === 'invitations') {
    if (invitationSubTab === 'teams') {
      emptyTitle = 'No page invitations';
      emptySubtitle = 'Invitations to join a business page will appear here';
    } else {
      emptyTitle = 'No channel invitations';
      emptySubtitle = "You haven't received any channel invitations";
    }
  } else {
    const validTab = activeTab as 'received' | 'sent';
    emptyTitle = EMPTY_STATE[validTab].title;
    emptySubtitle = EMPTY_STATE[validTab].subtitle;
  }

  // Handle batch confirmation
  const isBatchLoading =
    batchAccept.isPending ||
    batchDecline.isPending ||
    batchWithdraw.isPending ||
    batchDeclineInvitations.isPending;

  const handleConfirmBatchAction = async () => {
    const requestIds = allRequests.map((r) => r.id);
    if (!requestIds.length) {
      setConfirmModalType(null);
      return;
    }

    try {
      if (confirmModalType === 'withdraw-all') {
        await batchWithdraw.mutateAsync(requestIds);
      } else if (confirmModalType === 'decline-invitations') {
        await batchDeclineInvitations.mutateAsync({
          inviteIds: requestIds,
          subTab: invitationSubTab,
        });
      } else if (confirmModalType === 'decline-requests' || confirmModalType === 'decline-all') {
        await batchDecline.mutateAsync(requestIds);
      } else if (confirmModalType === 'accept-all') {
        await batchAccept.mutateAsync(requestIds);
      }
    } finally {
      setConfirmModalType(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary pb-6 sm:pb-8 md:pb-10 pt-0 font-dm-sans px-4 sm:px-6 md:px-8 md:pr-[253px]">
      <div className="w-full max-w-[800px] mx-auto">
        {/* Back header — only in expanded view */}
        {isExpanded && <ConnectionHeader />}

        {/* Page Header (Main & Expanded Views) */}
        <div className="w-full min-h-[52px] flex flex-col items-start gap-2 mb-5 select-none">
          <h1 className="font-dm-sans text-[16px] leading-6 font-semibold text-ds-text-primary">
            Connection
          </h1>
          <p className="font-dm-sans text-[14px] leading-5 font-normal text-ds-text-secondary">
            Manage inbound connection requests and expand your trusted network
          </p>
        </div>

        {/* 3 Tabs: Received, Sent, Invitation — only in main view */}
        {!isExpanded && <ConnectionTabs activeCount={totalCount} />}

        {/* Subheader Row: Count on Left, Batch Actions on Right */}
        <div className="w-full min-h-6 flex flex-wrap items-center justify-between gap-2 mb-2 select-none">
          <div className="flex items-center gap-2">
            <h2 className="font-dm-sans font-medium text-[16px] leading-6 text-ds-text-primary">
              <span className="hidden sm:inline">
                {activeTab === 'received' ? 'Pending Invitations' : activeTab === 'sent' ? 'Sent invitations' : 'Page invitations'}
              </span>
              <span className="inline sm:hidden">
                {activeTab === 'received' ? 'Invitations' : activeTab === 'sent' ? 'Sent invitations' : 'Page invitations'}
              </span>
            </h2>
            <span className="w-1 h-1 rounded-full bg-ds-text-muted shrink-0 inline-block" aria-hidden="true" />
            <span className="font-dm-sans text-[14px] leading-5 font-normal text-ds-text-secondary">
              {isLoading ? 'Loading...' : (
                <>
                  <span className="hidden sm:inline">{inboxCount} waiting</span>
                  <span className="inline sm:hidden">{inboxCount}</span>
                </>
              )}
            </span>
          </div>

          {/* Batch Actions on Right — Aligned with card action button columns */}
          {allRequests.length > 0 && !isLoading && activeTab !== 'invitations' && (
            <div className="flex items-center gap-2.5 shrink-0 sm:pr-2 font-dm-sans">
              {activeTab === 'received' && (
                <>
                  <div className="w-[89px] flex justify-center">
                    <button
                      type="button"
                      onClick={() => setConfirmModalType('accept-all')}
                      className="text-ds-accent font-medium text-[13px] sm:text-[14px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm hover:opacity-80"
                    >
                      Accept all
                    </button>
                  </div>
                  <span className="text-ds-border" aria-hidden="true">
                    |
                  </span>
                  <div className="w-[89px] flex justify-center">
                    <button
                      type="button"
                      onClick={() => setConfirmModalType('decline-requests')}
                      className="text-ds-text-secondary hover:text-ds-text-primary text-[13px] sm:text-[14px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm"
                    >
                      Decline all
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'sent' && (
                <div className="w-[89px] flex justify-center">
                  <button
                    type="button"
                    onClick={() => setConfirmModalType('withdraw-all')}
                    className="text-ds-accent font-medium text-[13px] sm:text-[14px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm hover:opacity-80"
                  >
                    Withdraw all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
            <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
          )}

          {/* Request cards */}
          {showContent && (
            <div className="flex flex-col bg-transparent">
              <RequestList
                requests={displayRequests}
                mode={activeTab}
                subTab={invitationSubTab}
              />

              {/* See All link below requests in main view when count > 3 */}
              {!isExpanded && (
                <SeeAllLink count={totalCount} href={`/connections/${activeTab}`} />
              )}
            </div>
          )}
        </div>

        {/* ── Suggestions section ("People you may know") ── */}
        <SuggestionsGrid enabled={showSuggestions} />

        {/* ── Batch Confirmation Modal ── */}
        <ConnectionConfirmModal
          isOpen={!!confirmModalType}
          type={confirmModalType}
          isLoading={isBatchLoading}
          onConfirm={handleConfirmBatchAction}
          onCancel={() => setConfirmModalType(null)}
        />
      </div>
    </div>
  );
}
export default ConnectionPage;
