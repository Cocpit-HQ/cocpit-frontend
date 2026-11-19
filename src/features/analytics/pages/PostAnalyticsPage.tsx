"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PostAnalytics } from '../components/profile-analytics/PostAnalytics';
import { ANALYTICS_FILTER_LABELS } from '../constants/analytics.constants';
import { useAnalyticsStore } from '../store/analytics.store';
import { Icon } from '@/components/icons';

export default function PostAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';
  const { filter, dateRange } = useAnalyticsStore();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/analytics?tab=Content');
    }
  };

  const handleClose = () => {
    useAnalyticsStore.getState().setMainTab('profile-analytics');
    useAnalyticsStore.getState().setProfileSubTab('Overview');
    router.push('/analytics');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] h-[100dvh] max-h-[100dvh] w-full bg-ds-bg text-ds-text-primary font-['DM_Sans'] overflow-y-auto overflow-x-hidden scrollbar-hide select-text animate-in fade-in-90 duration-200">
      {/* Back button: 40px top/left on desktop, 16px on mobile */}
      <button
        type="button"
        onClick={handleBack}
        className="fixed top-[16px] left-[16px] md:top-[40px] md:left-[40px] z-50 flex items-center gap-1.5 text-[14px] font-medium font-['DM_Sans'] text-ds-text-primary cursor-pointer bg-transparent border-none p-0 focus:outline-none select-none pointer-events-auto"
        title="Go back"
      >
        <Icon name="chevron-left" className="w-[18px] h-[18px] text-ds-text-primary" />
        <span>Back</span>
      </button>

      {/* Close button: Only show on desktop (hidden on mobile per user instruction) */}
      <button
        type="button"
        onClick={handleClose}
        className="hidden md:flex fixed top-[40px] right-[40px] z-50 w-[20px] h-[20px] items-center justify-center text-ds-text-primary cursor-pointer bg-transparent border-none p-0 focus:outline-none select-none pointer-events-auto"
        title="Close"
      >
        <Icon name="close" className="w-[20px] h-[20px]" />
      </button>

      {/* Main Content: 60px from top on desktop, 48px on mobile, exact Figma Dev Mode width: 846.67px */}
      <div className="w-[846.67px] max-w-full mx-auto px-4 xl:px-0 pt-[48px] md:pt-[60px] pb-12 flex flex-col">
        {/* Post Analytics Content */}
        <PostAnalytics postId={postId} filter={filter} initialDateRange={dateRange} />
      </div>
    </div>
  );
}
