"use client"

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function CommentItemSkeleton() {
  return (
    <div className="flex gap-3 relative group transition-all duration-300 font-poppins">
      {/* Avatar Column */}
      <div className="flex-shrink-0">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        {/* Top Info Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-[14px] w-[120px] rounded" />
            <Skeleton className="h-[12px] w-[180px] rounded" />
          </div>
          <div className="flex items-center pt-1">
            <Skeleton className="h-[12px] w-[40px] rounded" />
          </div>
        </div>

        {/* Comment Body */}
        <div className="space-y-1.5 mb-3">
          <Skeleton className="h-[14px] w-full rounded" />
          <Skeleton className="h-[14px] w-[90%] rounded" />
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-[12px] w-[80px] rounded" />
        </div>
      </div>
    </div>
  )
}

export function CommentListSkeleton() {
  return (
    <div className="space-y-6 font-poppins">
      {[1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          {/* Root Comment */}
          <CommentItemSkeleton />
          
          {/* Nested Replies for first comment */}
          {i === 1 && (
            <div className="ml-8 md:ml-10 pl-3 md:pl-4 space-y-4 mt-2">
              <CommentItemSkeleton />
              <CommentItemSkeleton />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default CommentListSkeleton
