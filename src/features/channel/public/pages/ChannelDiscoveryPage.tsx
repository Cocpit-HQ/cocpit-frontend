'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import RecommendedChannelsRail from '../components/RecommendedChannelsRail';
import MySubscriptionsList from '../components/MySubscriptionsList';

export default function ChannelDiscoveryPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-12 px-4 xl:px-0">
      <div className="w-full max-w-[960px] mx-auto flex flex-col gap-[24px]">
        
        <RecommendedChannelsRail />
        <MySubscriptionsList />
      </div>
    </div>
  );
}
