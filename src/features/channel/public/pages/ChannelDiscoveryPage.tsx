'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import RecommendedChannelsRail from '../components/RecommendedChannelsRail';
import MySubscriptionsList from '../components/MySubscriptionsList';

export default function ChannelDiscoveryPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-8 px-4 xl:px-0">
      <div className="w-full max-w-[998px] mx-auto flex flex-col gap-10">
        
        <RecommendedChannelsRail />
        <MySubscriptionsList />
      </div>
    </div>
  );
}
