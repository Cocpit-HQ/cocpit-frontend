"use client"

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function CreatePostCardSkeleton() {
  return (
    <div className="w-full max-w-[442px] mx-auto rounded-[8px] border border-ds-border bg-ds-surface-1 p-3 mb-4 animate-pulse">
      <div className="flex gap-3 mb-3 items-center">
        {/* Avatar circle placeholder */}
        <Skeleton className="w-[32px] h-[32px] rounded-full shrink-0 flex-none" />
        {/* Input area placeholder */}
        <Skeleton className="h-10 flex-1 rounded-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* 4 buttons placeholder */}
        <div className="flex items-center gap-2 py-2 px-3">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <div className="flex items-center gap-2 py-2 px-3">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <div className="flex items-center gap-2 py-2 px-3">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <div className="flex items-center gap-2 py-2 px-3">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
      </div>
    </div>
  )
}

export default CreatePostCardSkeleton
