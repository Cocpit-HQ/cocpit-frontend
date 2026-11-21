import React, { useState, useEffect, useRef } from 'react';
import { Icon, IconName } from '@/components/icons';
import Link from 'next/link';
import { ContentApiResponse } from '../../types/profile-analytics.types';
import { AnalyticsErrorState } from './AnalyticsErrorState';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';
import { AnalyticsFilterBar } from '../ui/AnalyticsFilterBar';
import { AnalyticsSortDropdown } from '../ui/AnalyticsSortDropdown';
import { useAnalyticsStore } from '../../store/analytics.store';
import { useAnalyticsContent } from '../../hooks/useAnalyticsContent';
import { ANALYTICS_SORT_OPTIONS } from '../../constants/analytics.constants';
import { stripMentionSyntax } from '@/lib/mentions';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-ds-surface-2 rounded-lg ${className ?? ''}`} />
);

const PostThumbnail = ({ post }: { post: any }) => {
  const [imgError, setImgError] = useState(false);

  let fallbackIconName: IconName = 'comment-article';
  const typeLower = (post?.type || '').toLowerCase();
  if (typeLower.includes('poll')) {
    fallbackIconName = 'poll-bar';
  } else if (typeLower.includes('media') || typeLower.includes('video') || typeLower.includes('image')) {
    fallbackIconName = 'image';
  } else if (typeLower.includes('article')) {
    fallbackIconName = 'comment-article';
  } else if (typeLower.includes('text')) {
    fallbackIconName = 'type';
  } else if (post?.icon) {
    fallbackIconName = post.icon as IconName;
  }

  if (!post.imgSrc || imgError) {
    return (
      <div className="w-[60px] h-[60px] rounded-[12px] overflow-hidden shrink-0 flex items-center justify-center bg-ds-surface-1">
        <Icon name={fallbackIconName} className="w-[24px] h-[24px] text-ds-accent" />
      </div>
    );
  }

  const isVideo = typeLower.includes('video');

  return (
    <div className="w-[60px] h-[60px] rounded-[12px] overflow-hidden shrink-0 flex items-center justify-center bg-ds-surface-1">
      {isVideo ? (
        <video src={post.imgSrc} className="w-full h-full object-cover" muted playsInline onError={() => setImgError(true)} />
      ) : (
        <img
          src={post.imgSrc}
          alt={post.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
};

export const ContentTab = () => {
  const { filter, dateRange, sortOption, setSortOption } = useAnalyticsStore();
  const { data, isLoading, error } = useAnalyticsContent(filter, sortOption, dateRange);
  const listRef = useRef<HTMLDivElement>(null);

  const formatCards = data
    ? [
        { label: 'Articles views', value: data.formatPerformance.articlesViews?.value ?? '0', icon: 'comment-article' as IconName },
        { label: 'Media views', value: data.formatPerformance.mediaViews?.value ?? '0', icon: 'comment-media' as IconName },
        { label: 'Polls views', value: data.formatPerformance.pollsViews?.value ?? '0', icon: 'comment-poll' as IconName },
        { label: 'Text views', value: data.formatPerformance.textViews?.value ?? '0', icon: 'type' as IconName },
      ]
    : [];

  const topPosts = data?.topPosts ?? [];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const lastPostId = sessionStorage.getItem('analytics_last_clicked_post_id');
    const savedScrollTop = sessionStorage.getItem('analytics_posts_scroll_top');
    const savedWindowScroll = sessionStorage.getItem('analytics_window_scroll_y');

    if (topPosts.length > 0 && (lastPostId || savedScrollTop !== null)) {
      const timer = setTimeout(() => {
        if (savedWindowScroll !== null) {
          window.scrollTo({ top: Number(savedWindowScroll), behavior: 'auto' });
        }
        if (savedScrollTop !== null && listRef.current) {
          listRef.current.scrollTop = Number(savedScrollTop);
        }
        if (lastPostId) {
          const el = document.getElementById(`analytics-post-${lastPostId}`);
          if (el) {
            el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
          }
        }
        sessionStorage.removeItem('analytics_last_clicked_post_id');
        sessionStorage.removeItem('analytics_posts_scroll_top');
        sessionStorage.removeItem('analytics_window_scroll_y');
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [topPosts, isLoading]);

  return (
    <div className="flex flex-col w-full mt-0">
      <AnalyticsFilterBar
        title={
          <>
            <span className="hidden sm:inline">Content format performance</span>
            <span className="sm:hidden">Format performance</span>
          </>
        }
      />

      {/* Error state */}
      {error && !isLoading && (
        <AnalyticsErrorState message={error.message || 'An error occurred'} />
      )}

      {/* Empty State */}
      {!isLoading && !error && data && topPosts.length === 0 && formatCards.every(f => Number(f.value) === 0) ? (
        <AnalyticsEmptyState 
          title="No content data yet" 
          message="You haven't posted any content or your posts haven't received engagement in this period."
        />
      ) : !error && (
        <>
      {/* Format Cards Grid: 4 columns x Fill 199.67px x Hug 97px, Gap 16px, Radius 16px */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[16px] mb-10 w-full max-w-[846.67px]">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-row justify-between items-end p-[16px] gap-[8px] h-[97px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[16px]">
                <div className="flex flex-col items-start gap-[8px]">
                  <Skeleton className="w-[70px] h-[16px]" />
                  <Skeleton className="w-[60px] h-[40px]" />
                </div>
                <Skeleton className="w-[20px] h-[20px]" />
              </div>
            ))
          : formatCards.map((format, idx) => (
              <div key={idx} className="flex flex-row justify-between items-end p-[16px] gap-[8px] h-[97px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[16px]">
                <div className="flex flex-col items-start gap-[8px]">
                  <span className="text-[12px] font-medium text-ds-text-secondary font-['DM_Sans'] leading-[16px] flex items-center h-[16px]">{format.label}</span>
                  <span className="text-[32px] font-bold text-ds-text-primary font-['DM_Sans'] leading-[40px] flex items-center h-[40px]">{format.value}</span>
                </div>
                <Icon name={format.icon as IconName} className="w-[20px] h-[20px] text-ds-text-secondary stroke-[1.5px]" />
              </div>
            ))}
      </div>

      {/* Top Performing Posts Header - Exact alignment with format cards and filter bar */}
      <div className="flex flex-row justify-between items-center gap-[10px] w-full max-w-[846.67px] min-h-[46px] mb-6">
        <div className="flex flex-col justify-center items-start gap-1 flex-1 min-h-[46px]">
          <h3 className="text-[16px] font-medium text-ds-text-primary font-['DM_Sans'] leading-[24px] m-0 p-0">{sortOption} posts</h3>
          <span className="text-[12px] font-normal text-ds-text-secondary font-['DM_Sans'] leading-[16px]">
            {sortOption === 'Top performing' && 'Ranked by engagement and professional impact'}
            {sortOption === 'Most recent' && 'Ranked by publication date'}
            {sortOption === 'Most viewed' && 'Ranked by views'}
            {sortOption === 'Most liked' && 'Ranked by likes'}
            {sortOption === 'Most shared' && 'Ranked by shares'}
          </span>
        </div>

        <AnalyticsSortDropdown
          value={sortOption}
          onChange={(opt) => setSortOption(opt)}
          className="z-30"
        />
      </div>

      {/* Posts List - Strict vertical alignment with Top performing posts and Format Cards */}
      <div 
        ref={listRef} 
        className="flex flex-col gap-4 relative z-10 max-h-[520px] overflow-y-auto scrollbar-hide no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-1 w-full max-w-[846.67px]"
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-row items-center py-[10px] px-0 gap-[14px] sm:gap-[16px] w-full min-h-[72px]">
                <Skeleton className="w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] rounded-[12px] shrink-0" />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <Skeleton className="w-3/4 h-[16px]" />
                  <Skeleton className="w-1/2 h-[14px]" />
                </div>
                <div className="hidden sm:flex gap-6">
                  <Skeleton className="w-[50px] h-[36px]" />
                  <Skeleton className="w-[50px] h-[36px]" />
                  <Skeleton className="w-[50px] h-[36px]" />
                </div>
              </div>
            ))
          : topPosts.map((post: any, idx: number) => (
              <Link 
                href={`/analytics/post/${post.id}`} 
                key={idx} 
                id={`analytics-post-${post.id}`}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('analytics_last_clicked_post_id', String(post.id));
                    if (listRef.current) {
                      sessionStorage.setItem('analytics_posts_scroll_top', String(listRef.current.scrollTop));
                    }
                    sessionStorage.setItem('analytics_window_scroll_y', String(window.scrollY));
                  }
                }}
                className="flex flex-row items-center py-[10px] px-0 gap-[14px] sm:gap-[16px] w-full min-h-[72px] cursor-pointer"
              >
                <PostThumbnail post={post} />
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="w-full text-[14px] font-normal text-ds-text-primary font-['DM_Sans'] leading-[20px] truncate">{stripMentionSyntax(post.title)}</span>
                  <div className="flex flex-row items-center gap-[6px] text-[12px] sm:text-[14px] text-ds-text-secondary font-['DM_Sans'] leading-[18px] sm:leading-[20px] mt-0.5 truncate w-full">
                    <span>{post.type}</span>
                    <div className="w-[3px] h-[3px] rounded-full bg-ds-text-muted shrink-0" />
                    <span className="truncate">Published on {post.date}</span>
                  </div>
                  {/* Mobile Metrics Row (Exact Figma mobile) */}
                  <div className="flex sm:hidden flex-row items-center gap-[16px] mt-1.5 text-ds-text-secondary text-[12px] font-['DM_Sans']">
                    <div className="flex items-center gap-1">
                      <Icon name="eye" className="w-[14px] h-[14px] text-ds-text-secondary" strokeWidth={1.5} />
                      <span>{post.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="like" className="w-[14px] h-[14px] text-ds-text-secondary" strokeWidth={1.5} />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="share" className="w-[14px] h-[14px] text-ds-text-secondary" strokeWidth={1.5} />
                      <span>{post.shares}</span>
                    </div>
                  </div>
                </div>
                {/* Desktop Metrics Row (Exact Figma desktop) */}
                <div className="hidden sm:flex flex-row justify-end items-center gap-[24px] shrink-0">
                  {[
                    { val: post.views, label: 'Views', icon: 'eye' as IconName },
                    { val: post.likes, label: 'Likes', icon: 'like' as IconName },
                    { val: post.shares, label: 'Shares', icon: 'share' as IconName },
                  ].map(({ val, label, icon }) => (
                    <div key={label} className="flex flex-col items-end gap-[4px] w-[60px] h-[40px]">
                      <span className="h-[20px] text-[14px] font-semibold text-ds-text-primary font-['DM_Sans'] leading-[20px] text-right">{val}</span>
                      <div className="flex flex-row justify-end items-center gap-[4px] w-full h-[16px]">
                        <Icon name={icon} className="w-[16px] h-[16px] text-ds-text-secondary" strokeWidth={1.5} />
                        <span className="h-[16px] text-[12px] font-normal text-ds-text-secondary font-['DM_Sans'] leading-[16px] text-right">{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
        {!isLoading && topPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-ds-text-muted font-['DM_Sans'] text-[14px]">
            No posts found for this period.
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
