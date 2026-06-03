"use client"

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function ProfilePostCardSkeleton() {
  return (
    <div className="flex flex-col items-start py-4 w-[285.33px] h-[504px] bg-card border border-[#EEF2FF] dark:border-card-border-inner shadow-card-inner rounded-[24px] relative flex-shrink-0 animate-pulse">
      {/* Header section */}
      <div className="w-full h-[40px] flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <Skeleton className="h-3 w-2/3 rounded" />
            <Skeleton className="h-2 w-1/2 rounded" />
            <Skeleton className="h-2.5 w-1/3 rounded" />
          </div>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="w-full flex flex-col gap-2 mb-2 px-4">
        <Skeleton className="h-3 w-5/6 rounded" />
      </div>

      {/* Main Media Placeholder */}
      <Skeleton className="w-full h-[300px] mb-4" />

      {/* Interaction Footer */}
      <div className="w-full h-[40px] px-4 py-2 mt-auto border-t border-transparent">
        <div className="flex items-center justify-between w-full h-[24px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-3 w-4 rounded" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-3 w-4 rounded" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-3 w-4 rounded" />
            </div>
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>
          <Skeleton className="w-5 h-5 rounded" />
        </div>
      </div>
    </div>
  )
}

export default ProfilePostCardSkeleton
