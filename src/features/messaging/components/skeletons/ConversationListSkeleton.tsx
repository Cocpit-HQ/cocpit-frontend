"use client"

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function ConversationListItemSkeleton() {
  return (
    <div className="box-border flex flex-col justify-center items-start px-[16px] mb-[16px] w-[348px] rounded-[24px] bg-[#FFFFFF] mx-auto py-[8px] relative animate-pulse">
      <div className="flex flex-col w-full relative">
        {/* GROUP 1: Avatar + Name + Headline */}
        <div className="flex flex-row items-center w-full relative">
          {/* Avatar Container */}
          <Skeleton className="w-[40px] h-[40px] rounded-full shrink-0" />
          
          {/* Text Block */}
          <div className="flex flex-col items-start pl-[8px] flex-1 gap-2 min-w-0 pr-[85px]">
            <Skeleton className="h-[14px] w-[80px] rounded" />
            <Skeleton className="h-[12px] w-[120px] rounded" />
          </div>

          {/* Time (Absolute Top Right) */}
          <Skeleton className="h-[12px] w-[40px] rounded absolute top-[2px] right-0" />
        </div>

        {/* GROUP 2: Last Message */}
        <div className="mt-[8px] pl-[48px] w-full">
          <Skeleton className="h-[14px] w-3/4 rounded" />
        </div>
      </div>
    </div>
  )
}

export function ConversationListSkeleton() {
  return (
    <div className="flex flex-col w-full gap-[8px] h-full overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <ConversationListItemSkeleton key={i} />
      ))}
    </div>
  )
}

export default ConversationListSkeleton
