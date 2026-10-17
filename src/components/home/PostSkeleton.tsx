"use client"

import React from 'react'

export default function PostSkeleton() {
  return (
    <div className="feed-card-shell animate-pulse p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-1/3 mb-2" />
          <div className="h-3 bg-muted rounded w-1/4" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-48 bg-muted rounded" />
      </div>
    </div>
  )
}
