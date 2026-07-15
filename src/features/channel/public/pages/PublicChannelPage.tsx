'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { usePublicChannel } from '../hooks/usePublicChannel';
import PublicChannelHeader from '../components/PublicChannelHeader';
import ChannelArticleCard from '../../components/ChannelArticleCard';

export default function PublicChannelPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params?.communityId as string;

  const { channel, articles, toggleSubscribe } = usePublicChannel(communityId);

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
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-8 px-4 xl:px-0">
      <div className="w-full max-w-[998px] mx-auto flex flex-col gap-6">
        <PublicChannelHeader channel={channel} onToggleSubscribe={toggleSubscribe} />

        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1 mt-6">
            <h3 className="text-black dark:text-[#FFFFFF] text-[16px] font-bold font-['Poppins'] leading-tight">
              All articles
            </h3>
            <p className="text-gray-500 text-[11px] font-semibold font-['Poppins']">
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
