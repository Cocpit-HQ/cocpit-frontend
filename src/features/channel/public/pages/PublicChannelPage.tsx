'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { usePublicChannel } from '../hooks/usePublicChannel';
import PublicChannelHeader from '../components/PublicChannelHeader';
import ChannelArticleCard from '../../components/ChannelArticleCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublicChannelPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params?.communityId as string;

  const { channel, articles, isLoading, toggleSubscribe } = usePublicChannel(communityId);

  if (isLoading) {
    return (
      <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-8 px-4 xl:px-0">
        <div className="w-full max-w-[998px] mx-auto flex flex-col gap-6">
          {/* Header Skeleton */}
          <div className="w-full flex flex-col gap-4">
            <Skeleton className="w-full aspect-[6/1] rounded-3xl" />
            <div className="w-full flex flex-col gap-3 px-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-24 rounded-full mt-1" />
            </div>
          </div>

          {/* Articles Skeleton */}
          <div className="w-full flex flex-col gap-4 mt-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20 mb-2" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="w-full flex flex-col bg-white dark:bg-[#121B2B] rounded-[24px] border border-gray-100 dark:border-[#2A2D35] p-5 gap-4">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 w-2/3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <Skeleton className="w-[120px] h-[120px] rounded-xl shrink-0 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500 text-sm font-['Poppins']">Channel not found.</p>
        <button onClick={() => router.push('/channels')} className="text-[#1A73E8] text-sm font-semibold font-['Poppins']">
          Back to channels
        </button>
      </div>
    );
  }

  const published = articles.filter((a) => a.status === 'published');

  return (
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-0 md:pt-6 pb-8 md:px-4 xl:px-0">
      
      {/* ── Custom Mobile Header ── */}
      <div className="md:hidden flex flex-row items-center gap-[16px] px-4 pt-10 pb-4 h-[80px] bg-white dark:bg-[#0F1115]">
        <button
          onClick={() => router.back()}
          className="w-[48px] h-[48px] rounded-[100px] border border-[#E0E0E7] dark:border-[#2E3445] backdrop-blur-[12px] flex items-center justify-center shrink-0"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6B7280] dark:text-[#A1A8B3]">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex flex-col">
          <span className="text-black dark:text-white text-[18px] font-medium font-['Poppins'] leading-[26px]">
            Channel
          </span>
          <span className="text-[#6B7280] dark:text-[#A1A8B3] text-[12px] font-normal font-['Poppins'] leading-[16px]">
            View channel details
          </span>
        </div>
      </div>

      <div className="w-full max-w-[998px] mx-auto flex flex-col gap-6 md:px-0">
        <PublicChannelHeader channel={channel} onToggleSubscribe={toggleSubscribe} />

        <div className="w-full flex flex-col gap-4 px-4 md:px-0">
          <div className="flex flex-col gap-1 mt-6">
            <h3 className="text-black dark:text-[#FFFFFF] text-[18px] md:text-[16px] font-medium md:font-bold font-['Poppins'] leading-[26px] md:leading-tight">
              All articles
            </h3>
            <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[12px] md:text-[11px] font-normal md:font-semibold font-['Poppins'] leading-[16px]">
              Total articles - {published.length}
            </p>
          </div>

          {published.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-[#121B2B] flex items-center justify-center">
                <Icon icon="solar:document-text-linear" className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-400 text-xs font-['Poppins']">No published articles yet.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              {published.map((article) => (
                <ChannelArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => router.push(`/channels/${communityId}/article/${article.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
