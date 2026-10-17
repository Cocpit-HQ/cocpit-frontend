"use client"

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function FollowListItemSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 w-full animate-pulse">
      <div className="flex items-center gap-5 flex-1 min-w-0">
        {/* Avatar circle */}
        <Skeleton className="h-11 w-11 rounded-full shrink-0" />
        
        {/* Text Block */}
        <div className="min-w-0 flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-3.5 w-1/2 rounded" />
        </div>
      </div>

      {/* Button placeholder */}
      <Skeleton className="h-[36px] w-[90px] rounded-[24px] shrink-0 ml-4" />
    </div>
  )
}

export default FollowListItemSkeleton
