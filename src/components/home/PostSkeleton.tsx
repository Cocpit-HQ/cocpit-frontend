"use client"

import React from 'react'

export default function PostSkeleton() {
  return (
    <div className="md:rounded-xl border p-6 animate-pulse bg-gray-100 dark:bg-[#242b3d] border-gray-200 dark:border-[#2d3548]">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-[#2b3345]" />
        <div className="flex-1">
          <div className="h-4 bg-gray-300 dark:bg-[#323a4b] rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-300 dark:bg-[#323a4b] rounded w-1/4" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-3 bg-gray-300 dark:bg-[#323a4b] rounded w-full" />
        <div className="h-3 bg-gray-300 dark:bg-[#323a4b] rounded w-5/6" />
        <div className="h-48 bg-gray-300 dark:bg-[#1f2534] rounded" />
      </div>
    </div>
  )
}
