'use client';

import React, { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as channelService from '../../services/channel.service';
import type { SearchedArticle } from '../../services/channel.service';
import type { Channel } from '../../types/channel.types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannelSearchBar } from '../components/ChannelSearchBar';

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
      className="w-full flex flex-col md:flex-row items-start gap-[10px] md:gap-[16px] group cursor-pointer p-0 md:p-[16px] border border-transparent hover:border-transparent md:hover:border-[#EEF2FF] dark:md:hover:border-[#1C2340] rounded-[16px] hover:bg-transparent md:hover:bg-[#F9FAFB] dark:md:hover:bg-[#121B2B] transition-all"
    >
      {/* Image */}
      <div className="w-full md:w-[177px] aspect-[2/1] md:aspect-auto md:h-[88.5px] rounded-[12px] overflow-hidden shrink-0 bg-gray-100 dark:bg-[#1C2333] border border-gray-100 dark:border-[#2A2D35]">
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
      <div className="flex flex-col gap-[4px] md:gap-[8px] w-full flex-1 min-w-0 md:py-1">
        <h5 className="text-black dark:text-white text-[14px] md:text-[18px] font-semibold md:font-medium leading-[20px] md:leading-[26px] font-['Poppins'] line-clamp-1 group-hover:text-[#6366F1] dark:group-hover:text-[#818CF8] transition-colors">
          {article.title || 'Untitled Article'}
        </h5>
        <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[12px] md:text-[16px] font-normal leading-[16px] md:leading-[24px] font-['Poppins'] line-clamp-2 md:line-clamp-2">
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
    <div className="w-full flex items-center gap-[10px] md:gap-[16px] p-0 md:p-[16px] bg-transparent md:bg-white dark:md:bg-[#121B2B] border-none md:border md:border-[#EEF2FF] dark:md:border-[#1C2340] rounded-[12px] hover:shadow-none md:hover:shadow-sm transition-shadow">
      {/* Logo */}
      <div
        onClick={onClickChannel}
        className="w-[64px] md:w-[80px] h-[64px] md:h-[80px] rounded-[12px] overflow-hidden shrink-0 bg-gray-100 dark:bg-[#1C2333] border border-gray-100 dark:border-[#2A2D35] cursor-pointer"
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
      <div onClick={onClickChannel} className="flex flex-col gap-[0px] md:gap-[4px] flex-1 min-w-0 cursor-pointer">
        <h4 className="text-black dark:text-white text-[16px] font-semibold leading-[24px] font-['Poppins'] truncate">
          {channel.name}
        </h4>
        <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[12px] font-normal leading-[16px] font-['Poppins'] truncate">
          {channel.companyName || 'Channel'}
        </p>
        <p className="text-black dark:text-white text-[12px] font-semibold md:font-medium leading-[24px] md:leading-[16px] font-['Poppins']">
          {formatCount(channel.subscriberCount || 0)} Subscriber
        </p>
      </div>

      {/* Subscribe button */}
      {!channel.isOwner && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSubscribe();
          }}
          className={`hidden md:flex shrink-0 w-[142px] h-[40px] rounded-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] transition-all active:scale-95 items-center justify-center ${
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
    <div className="w-full flex flex-col md:flex-row items-start gap-[10px] md:gap-[16px] p-0 md:p-[16px]">
      <Skeleton className="w-full md:w-[177px] aspect-[2/1] md:aspect-auto md:h-[88.5px] rounded-[12px] shrink-0" />
      <div className="flex flex-col gap-[4px] md:gap-[8px] w-full flex-1 min-w-0 md:py-1">
        <Skeleton className="h-[20px] md:h-[26px] w-3/4" />
        <Skeleton className="h-[16px] md:h-[24px] w-full mt-1" />
        <Skeleton className="h-[16px] md:h-[24px] w-5/6 hidden md:block" />
      </div>
    </div>
  );
}

function ChannelSkeleton() {
  return (
    <div className="w-full flex items-center gap-[10px] md:gap-[16px] p-0 md:p-[16px] border-none md:border md:border-[#EEF2FF] dark:md:border-[#1C2340] rounded-[12px]">
      <Skeleton className="w-[64px] md:w-[80px] h-[64px] md:h-[80px] rounded-[12px] shrink-0" />
      <div className="flex flex-col gap-[2px] md:gap-[6px] flex-1">
        <Skeleton className="h-[16px] md:h-[24px] w-2/5" />
        <Skeleton className="h-[12px] md:h-[16px] w-1/4 mt-1" />
        <Skeleton className="h-[12px] md:h-[16px] w-1/3" />
      </div>
      <Skeleton className="hidden md:block w-[142px] h-[40px] rounded-[24px] shrink-0" />
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

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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

        {/* ── Custom Mobile Header ── */}
        <div className="md:hidden flex flex-col gap-[24px]">
          {/* Top Bar */}
          <div className="flex flex-row items-center gap-[8px]">
            <button
              onClick={() => router.back()}
              className="w-[48px] h-[48px] rounded-[100px] border border-[#DADADA] dark:border-[#2E3445] backdrop-blur-[12px] flex items-center justify-center shrink-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6B7280] dark:text-[#A1A8B3]">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex flex-col">
              <span className="text-black dark:text-white text-[16px] font-medium font-['Poppins'] leading-[24px]">
                Search
              </span>
              <span className="text-[#6B7280] dark:text-[#A1A8B3] text-[12px] font-normal font-['Poppins'] leading-[16px]">
                Find the channel, article you want
              </span>
            </div>
          </div>

          {/* Search Bar Row */}
          <div className="flex flex-row items-center gap-[16px] w-full">
            <ChannelSearchBar 
              initialQuery={query}
              filterParam={filterParam}
              placeholder="Tech"
              showFilterIcon={true}
              onFilterClick={() => setIsMobileFilterOpen(true)}
            />
          </div>
        </div>

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

      {/* Mobile Filter Modal */}
      {isMobileFilterOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/40 md:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-[#0F1115] border-t border-[#EEF2FF] dark:border-[#1C2340] rounded-t-[24px] p-2 pb-10 flex flex-col items-center gap-2 md:hidden animate-in slide-in-from-bottom-full duration-300">
            {/* Handle for bottom sheet */}
            <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full my-2 mb-4" />
            
            {(['All', 'Channels', 'Articles'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (query) params.set('q', query);
                  if (filter !== 'All') params.set('filter', filter);
                  router.push(`/channels/search?${params.toString()}`);
                  setIsMobileFilterOpen(false);
                }}
                className={`w-full max-w-[359px] h-[40px] flex items-center  rounded-[24px] bg-white dark:bg-[#121B2B] ${
                  filterParam === filter
                    ? 'text-[#6366F1] dark:text-[#818CF8]'
                    : 'text-black dark:text-white'
                } font-['Poppins'] font-normal text-[14px] leading-[20px] transition-colors`}
              >
                {filter}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
