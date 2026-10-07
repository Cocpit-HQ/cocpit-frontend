'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationTabs } from '../components/NotificationTabs';
import { NotificationList } from '../components/NotificationList';
import { NotificationErrorState } from '../components/NotificationErrorState';
import { ClearAllModal } from '../components/ClearAllModal';

export const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    notifications,
    displayedNotifications,
    activeTab,
    setActiveTab,
    loading,
    hasError,
    hasUnread,
    isCleared,
    showClearConfirm,
    setShowClearConfirm,
    handleRead,
    handleDelete,
    handleMarkAllAsRead,
    handleClearAll,
    refetch,
  } = useNotifications();

  const handleRetry = () => {
    refetch();
  };

  const handleBack = () => {
    const returnTo = searchParams?.get('returnTo') || searchParams?.get('from');
    if (returnTo) {
      router.push(returnTo);
      return;
    }

    const lastLocation = typeof window !== 'undefined'
      ? sessionStorage.getItem('cocpit_last_location')
      : null;

    if (lastLocation && lastLocation !== '/notifications') {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push(lastLocation);
      }
      return;
    }

    if (
      typeof window !== 'undefined' &&
      document.referrer &&
      document.referrer.startsWith(window.location.origin) &&
      !document.referrer.includes('/notifications')
    ) {
      router.back();
      return;
    }

    router.push('/feed');
  };

  const handleClose = () => {
    router.push('/feed');
  };

  return (
    <div className="fixed inset-0 h-screen w-full bg-ds-bg text-ds-text-primary font-['DM_Sans'] overflow-hidden flex flex-col">
      {/* Back — absolute, 16px from top/left on mobile, 40px on desktop */}
      <button
        type="button"
        onClick={handleBack}
        className="absolute left-4 sm:left-10 top-4 sm:top-10 h-[36px] px-2 flex flex-row items-center gap-1.5 text-ds-text-primary ds-text-secondary-1 font-['DM_Sans'] hover:text-ds-text-primary/80 transition-colors cursor-pointer group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent z-20"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5 text-ds-text-primary transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} />
        <span>Back</span>
      </button>

      {/* Close — absolute, 16px from top/right on mobile, 40px on desktop (hidden on error state per design) */}
      {!hasError && (
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 sm:right-10 top-4 sm:top-10 w-9 h-9 rounded-full flex items-center justify-center text-ds-text-primary hover:text-ds-text-primary/80 hover:bg-ds-surface-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-ds-text-primary" strokeWidth={1.75} />
        </button>
      )}

      {/* Main content — 800px centered, title at 60px from page top */}
      <main className="max-w-[800px] mx-auto w-full flex-1 min-h-0 px-4 sm:px-0 pt-[60px] sm:pt-[60px] flex flex-col overflow-hidden mt-6 sm:mt-0">

        {/* ── Title block ─────────────────────────────────────────── */}
        {/* Height: 24 (title) + 8 (gap) + 20 (subtitle) = 52px, matches design "Frame 2609716" */}
        <header className="flex-shrink-0 flex flex-row items-end justify-between pt-0">
          <div className="flex flex-col gap-2">
            {/* "Notifications" — 16px/600/24px-lh (.ds-text-body-2) / text-primary */}
            <h1 className="ds-text-body-2 font-['DM_Sans'] text-ds-text-primary m-0 p-0">
              Notifications
            </h1>
            {/* "Stay update..." — 14px/400/20px-lh (.ds-text-secondary) / text-secondary */}
            <p className="ds-text-secondary font-['DM_Sans'] text-ds-text-secondary m-0 p-0">
              Stay update with your account activity
            </p>
          </div>

          {/* On error state: disabled 'Make all as read' matches Figma design */}
          {hasError && (
            <span className="ds-text-secondary font-['DM_Sans'] text-ds-text-muted select-none cursor-not-allowed">
              Make all as read
            </span>
          )}
        </header>

        {/* ── Tab row — 20px below title block (hidden on error) ───── */}
        {!hasError && (
          <div className="flex-shrink-0 mt-5">
            <NotificationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearAllClick={() => setShowClearConfirm(true)}
              hasNotifications={notifications.length > 0}
              hasUnread={hasUnread}
            />
          </div>
        )}

        {/* ── Scrollable notification list — hidden scrollbar ──────── */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-8">
          {hasError ? (
            <NotificationErrorState onRetry={handleRetry} />
          ) : (
            <NotificationList
              items={displayedNotifications}
              loading={loading}
              activeTab={activeTab}
              isCleared={isCleared}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>

      <ClearAllModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
      />
    </div>
  );
};

export default NotificationsPage;
