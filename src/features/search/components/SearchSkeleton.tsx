'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchCategory } from '../types/search.types';

interface SearchSkeletonProps {
  category?: SearchCategory;
}

export const SearchSkeleton: React.FC<SearchSkeletonProps> = ({ category = 'all' }) => {
  if (category === 'posts') {
    return (
      <div className="w-full max-w-[442px] mx-auto px-4 flex flex-col gap-6 pb-16">
        {[1, 2].map((i) => (
          <div key={i} className="w-full flex flex-col gap-3 pb-4 border-b border-ds-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-full shrink-0 bg-ds-surface-1" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-28 rounded-md bg-ds-surface-1" />
                  <Skeleton className="h-2.5 w-20 rounded-md bg-ds-surface-1" />
                </div>
              </div>
              <Skeleton className="h-4 w-12 rounded-md bg-ds-surface-1" />
            </div>
            <Skeleton className="h-3 w-full rounded-md bg-ds-surface-1" />
            <Skeleton className="h-3 w-4/5 rounded-md bg-ds-surface-1" />
            <Skeleton className="w-full h-64 rounded-lg bg-ds-surface-1" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-4 w-32 rounded-md bg-ds-surface-1" />
              <Skeleton className="h-4 w-6 rounded-md bg-ds-surface-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[720px] mx-auto px-4 sm:px-6 flex flex-col gap-8 pb-16">
      {/* People section skeleton */}
      <div className="border-b border-ds-border pb-6 flex flex-col gap-4">
        <Skeleton className="h-5 w-24 rounded-md bg-ds-surface-1" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-3">
              <Skeleton className="size-11 rounded-full shrink-0 bg-ds-surface-1" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32 rounded-md bg-ds-surface-1" />
                <Skeleton className="h-3 w-48 rounded-md bg-ds-surface-1" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full shrink-0 bg-ds-surface-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Jobs section skeleton */}
      <div className="border-b border-ds-border pb-6 flex flex-col gap-4">
        <Skeleton className="h-5 w-16 rounded-md bg-ds-surface-1" />
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="w-full p-4 sm:p-5 bg-ds-surface-1 rounded-2xl border border-ds-border flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-xl shrink-0 bg-ds-surface-2" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-36 rounded-md bg-ds-surface-2" />
                    <Skeleton className="h-3 w-24 rounded-md bg-ds-surface-2" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-md bg-ds-surface-2" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-3.5 w-48 rounded-md bg-ds-surface-2" />
                <Skeleton className="h-8 w-24 rounded-full bg-ds-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
