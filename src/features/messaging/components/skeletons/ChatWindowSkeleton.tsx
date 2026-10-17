"use client"

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ChatSkeleton from '../ui/ChatSkeleton'

export function ChatWindowSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-[var(--card)] rounded-[24px] overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="px-[16px] py-[12px] border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)] shrink-0">
        <div className="flex flex-row items-center">
          <Skeleton className="w-[40px] h-[40px] rounded-full mr-[8px]" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <Skeleton className="h-[14px] w-[120px] rounded" />
            <Skeleton className="h-[10px] w-[80px] rounded" />
          </div>
        </div>
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>

      {/* Messages list skeleton area */}
      <div className="flex-1 overflow-hidden">
        <ChatSkeleton />
      </div>

      {/* Input section skeleton */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] flex items-center gap-3 shrink-0">
        <Skeleton className="h-10 flex-1 rounded-[24px]" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  )
}

export default ChatWindowSkeleton
