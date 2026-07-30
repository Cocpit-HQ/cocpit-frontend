'use client';

import React, { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as channelService from '../../services/channel.service';
import type { SearchedArticle } from '../../services/channel.service';
import type { Channel } from '../../types/channel.types';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────────────────
type FilterType = 'All' | 'Channels' | 'Articles';

type MixedResult =
  | { kind: 'channel'; data: Channel }
  | { kind: 'article'; data: SearchedArticle };

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

/**
 * Interleaves channels and articles in a 1:2 ratio so the list feels mixed.
 * Pattern: article, article, channel, article, article, channel, ...
 * Remaining items from whichever list is longer are appended at the end.
 */
function mergeResults(channels: Channel[], articles: SearchedArticle[]): MixedResult[] {
  const result: MixedResult[] = [];
  let ci = 0;
  let ai = 0;

  while (ci < channels.length || ai < articles.length) {
    // 2 articles
    for (let i = 0; i < 2 && ai < articles.length; i++, ai++) {
      result.push({ kind: 'article', data: articles[ai] });
    }
    // 1 channel
    if (ci < channels.length) {
      result.push({ kind: 'channel', data: channels[ci] });
      ci++;
    }
  }

  return result;
}

// ── Article card ───────────────────────────────────────────────────────────────
function ArticleCard({ article, onClick }: { article: SearchedArticle; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="w-full flex flex-row items-start gap-[16px] cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="w-[140px] sm:w-[177px] h-[88.5px] rounded-[24px] overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EEF2FF] to-[#C7D2FE] dark:from-[#1C2340] dark:to-[#1e1b4b]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M7 8h10M7 12h10M7 16h6" />
            </svg>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-[8px] flex-1 min-w-0 py-1">
        <h5 className="text-black dark:text-white text-[16px] sm:text-[18px] font-medium leading-[24px] sm:leading-[26px] font-['Poppins'] line-clamp-1 group-hover:text-[#6366F1] dark:group-hover:text-[#818CF8] transition-colors">
          {article.title || 'Untitled Article'}
        </h5>
        <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[14px] sm:text-[16px] font-normal leading-[22px] sm:leading-[24px] font-['Poppins'] line-clamp-2">
          {article.excerpt || 'No preview available.'}
        </p>
      </div>
    </div>
  );
}

// ── Channel card ───────────────────────────────────────────────────────────────
function ChannelCard({
  channel,
  onToggleSubscribe,
  onClickChannel,
}: {
  channel: Channel;
  onToggleSubscribe: () => void;
  onClickChannel: () => void;
}) {
  return (
    <div className="w-full flex items-center gap-[16px] p-[16px] bg-white dark:bg-[#121B2B] border border-[#EEF2FF] dark:border-[#1C2340] rounded-[12px] hover:shadow-sm transition-shadow">
      {/* Logo */}
      <div
        onClick={onClickChannel}
        className="w-[80px] h-[80px] rounded-[12px] overflow-hidden shrink-0 bg-gray-100 dark:bg-[#1C2333] border border-gray-100 dark:border-[#2A2D35] cursor-pointer"
      >
        {channel.logoUrl ? (
          <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EEF2FF] to-[#C7D2FE] dark:from-[#1C2340] dark:to-[#1e1b4b]">
            <span className="text-[#6366F1] font-bold text-xl font-['Poppins']">
              {(channel.name || 'C').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div onClick={onClickChannel} className="flex flex-col gap-[4px] flex-1 min-w-0 cursor-pointer">
        <h4 className="text-black dark:text-white text-[16px] font-semibold leading-[24px] font-['Poppins'] truncate">
          {channel.name}
        </h4>
        <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[12px] font-normal leading-[16px] font-['Poppins'] truncate">
          {channel.companyName || 'Channel'}
        </p>
        <p className="text-black dark:text-white text-[12px] font-medium leading-[16px] font-['Poppins']">
          {formatCount(channel.subscriberCount || 0)} subscribers
        </p>
      </div>

      {/* Subscribe button */}
      {!channel.isOwner && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSubscribe();
          }}
          className={`shrink-0 w-[142px] h-[40px] rounded-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] transition-all active:scale-95 flex items-center justify-center ${
            channel.isSubscribed
              ? 'bg-transparent border border-[#6366F1] dark:border-[#818CF8] text-[#6366F1] dark:text-[#818CF8] hover:bg-[#6366F1]/10'
              : 'bg-[#6366F1] dark:bg-[#818CF8] text-white hover:opacity-90'
          }`}
        >
          {channel.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
      )}
    </div>
  );
}

// ── Skeleton loaders ───────────────────────────────────────────────────────────
function ArticleSkeleton() {
  return (
    <div className="w-full flex flex-row items-start gap-[16px]">
      <Skeleton className="w-[140px] sm:w-[177px] h-[88.5px] rounded-[24px] shrink-0" />
      <div className="flex flex-col gap-[8px] flex-1 min-w-0 py-1">
        <Skeleton className="h-[20px] w-3/4" />
        <Skeleton className="h-[16px] w-full" />
        <Skeleton className="h-[16px] w-5/6" />
      </div>
    </div>
  );
}

function ChannelSkeleton() {
  return (
    <div className="w-full flex items-center gap-[16px] p-[16px] border border-[#EEF2FF] dark:border-[#1C2340] rounded-[12px]">
      <Skeleton className="w-[80px] h-[80px] rounded-[12px] shrink-0" />
      <div className="flex flex-col gap-[6px] flex-1">
        <Skeleton className="h-[16px] w-2/5" />
        <Skeleton className="h-[12px] w-1/4" />
        <Skeleton className="h-[12px] w-1/3" />
      </div>
      <Skeleton className="w-[142px] h-[40px] rounded-[24px] shrink-0" />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ChannelSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const query = searchParams?.get('q') || '';
  const filterParam = (searchParams?.get('filter') || 'All') as FilterType;

  const showChannels = filterParam === 'All' || filterParam === 'Channels';
  const showArticles = filterParam === 'All' || filterParam === 'Articles';

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ['channel-search', query],
    queryFn: () => channelService.searchChannels(query),
    enabled: showChannels && query.length > 0,
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery<SearchedArticle[]>({
    queryKey: ['article-search', query],
    queryFn: () => channelService.searchArticles(query),
    enabled: showArticles && query.length > 0,
  });

  const isLoading = (showChannels && channelsLoading) || (showArticles && articlesLoading);

  // ── Subscribe / Unsubscribe ──────────────────────────────────────────────────
  const subscribeMutation = useMutation({
    mutationFn: ({ channelId, isSubscribed }: { channelId: string; isSubscribed: boolean }) =>
      isSubscribed
        ? channelService.unsubscribeFromCommunity(channelId)
        : channelService.subscribeToCommunity(channelId),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: ['channel-search'] });
      queryClient.invalidateQueries({ queryKey: ['subscribed-channels'] });
      queryClient.invalidateQueries({ queryKey: ['public-channel', channelId] });
    },
  });

  const handleToggleSubscribe = useCallback((channel: Channel) => {
    subscribeMutation.mutate({ channelId: channel.id, isSubscribed: !!channel.isSubscribed });
  }, [subscribeMutation]);

  // ── Merged results ───────────────────────────────────────────────────────────
  // When filter = 'All': interleave channels and articles (2 articles, 1 channel pattern)
  // When filter = 'Channels': only channels in a plain list
  // When filter = 'Articles': only articles in a plain list
  const mergedResults: MixedResult[] =
    filterParam === 'All'
      ? mergeResults(channels, articles)
      : filterParam === 'Channels'
      ? channels.map((c) => ({ kind: 'channel', data: c }))
      : articles.map((a) => ({ kind: 'article', data: a }));

  const isEmpty = !isLoading && mergedResults.length === 0;

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#0F1115] pb-16">
      <div className="w-full max-w-[960px] mx-auto pt-4 md:pt-6 px-4 xl:px-0 flex flex-col gap-[24px]">

        {/* Active filter badge */}
        {filterParam !== 'All' && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[#6366F1] dark:text-[#818CF8] text-[12px] font-medium font-['Poppins']">
              {filterParam}
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (query) params.set('q', query);
                  router.replace(`/channels/search?${params.toString()}`, { scroll: false });
                }}
                className="ml-1 hover:opacity-70 text-base leading-none"
                aria-label="Clear filter"
              >
                ×
              </button>
            </span>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────────── */}
        <div className="w-full flex flex-col gap-[24px]">

          {/* Loading skeletons — match the merge pattern so layout doesn't jump */}
          {isLoading && (
            <>
              <ArticleSkeleton />
              <ArticleSkeleton />
              <ChannelSkeleton />
              <ArticleSkeleton />
              <ArticleSkeleton />
              <ChannelSkeleton />
            </>
          )}

          {/* Merged list */}
          {!isLoading && mergedResults.map((item, idx) =>
            item.kind === 'article' ? (
              <ArticleCard
                key={`article-${item.data.id}`}
                article={item.data}
                onClick={() => router.push(`/channels/${item.data.channelId}/article/${item.data.id}`)}
              />
            ) : (
              <ChannelCard
                key={`channel-${item.data.id}`}
                channel={item.data}
                onToggleSubscribe={() => handleToggleSubscribe(item.data)}
                onClickChannel={() => router.push(`/channels/${item.data.id}`)}
              />
            )
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="py-20 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#EEF2FF] dark:bg-[#1e1b4b] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <div>
                <h3 className="text-black dark:text-white text-[16px] font-semibold font-['Poppins']">
                  {query ? `No results for "${query}"` : 'Start searching'}
                </h3>
                <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[14px] font-normal font-['Poppins'] mt-1">
                  {query
                    ? 'Try a different search term or change the filter.'
                    : 'Type in the search bar above to find channels and articles.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
