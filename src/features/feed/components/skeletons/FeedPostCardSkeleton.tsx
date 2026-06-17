"use client"

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function FeedPostCardSkeleton() {
  return (
    <div className="feed-card-shell flex w-full max-w-[560px] flex-col gap-4 overflow-hidden animate-pulse">
      {/* Header section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            {/* Avatar placeholder */}
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />

            {/* User details placeholder */}
            <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <Skeleton className="h-2 w-1/4 rounded" />
            </div>
          </div>
        </div>

        {/* Post content text lines */}
        <div className="space-y-2 mt-1">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
        </div>
      </div>

      {/* Main Image/Video Media Placeholder */}
      <Skeleton className="w-full h-[300px]" />

      {/* Action buttons row */}
      <div className="py-2 flex items-center justify-between border-t border-transparent mt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 py-1">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-3 w-6 rounded" />
          </div>
          <div className="flex items-center gap-1.5 py-1">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-3 w-6 rounded" />
          </div>
          <div className="flex items-center gap-1.5 py-1">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-3 w-6 rounded" />
          </div>
          <div className="flex items-center py-1">
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 rounded" />
      </div>
    </div>
  )
}

export default FeedPostCardSkeleton
