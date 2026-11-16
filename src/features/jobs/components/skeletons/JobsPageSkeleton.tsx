import React from 'react';
import RecommendedJobCardSkeleton from './RecommendedJobCardSkeleton';
import JobCardSkeleton from './JobCardSkeleton';

export const JobsPageSkeleton: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans px-4 sm:px-6 md:px-8 pt-0 pb-6 sm:pb-8 md:pb-10 md:pr-[253px] select-text">
      {/* 800px Centered Main Jobs Container aligned exactly with Profile and Global Search */}
      <div className="w-full max-w-[800px] mx-auto flex flex-col items-center">
        {/* Sticky Top Navigation Bar matching Figma Frame 2609735 (w: 800px, h: 36px, gap: 20px, NO bottom divider) */}
        <div className="sticky top-[64px] z-30 w-full max-w-[800px] bg-ds-bg/95 backdrop-blur-md h-9 flex items-center justify-between gap-5 mb-5">
          {/* Left Tabs: Explore, My applications, Offers, Save */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-9">
            {/* Explore tab with accent indicator */}
            <div className="relative h-9 w-[81px] flex flex-col justify-center items-center">
              <div className="w-14 h-4 bg-ds-surface-1 rounded animate-pulse" />
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-ds-accent" />
            </div>
            {/* My applications */}
            <div className="h-9 w-[144px] flex justify-center items-center">
              <div className="w-24 h-4 bg-ds-surface-1 rounded animate-pulse" />
            </div>
            {/* Offers */}
            <div className="h-9 w-[71px] flex justify-center items-center">
              <div className="w-12 h-4 bg-ds-surface-1 rounded animate-pulse" />
            </div>
            {/* Save */}
            <div className="h-9 w-[60px] flex justify-center items-center">
              <div className="w-10 h-4 bg-ds-surface-1 rounded animate-pulse" />
            </div>
          </div>

          {/* Right side: 'Posted jobs' pill button skeleton */}
          <div className="w-[133px] h-9 px-3 py-1.5 bg-ds-surface-1 rounded-full flex items-center justify-center gap-1 shrink-0 animate-pulse">
            <div className="w-20 h-4 bg-ds-surface-2 rounded" />
          </div>
        </div>

        {/* Tab Content Skeleton (Explore Tab layout) */}
        <div className="w-full max-w-[800px] flex flex-col gap-10">
          {/* Section 1: Featured opportunities */}
          <div className="w-full max-w-[800px] flex flex-col gap-5">
            <div className="w-full h-6 flex items-center justify-between gap-2">
              <div className="w-40 h-5 bg-ds-surface-1 rounded animate-pulse" />
              <div className="w-12 h-4 bg-ds-surface-1 rounded animate-pulse" />
            </div>
            <div className="w-full flex items-center gap-5 overflow-hidden pb-1">
              <RecommendedJobCardSkeleton />
              <RecommendedJobCardSkeleton />
              <RecommendedJobCardSkeleton />
            </div>
          </div>

          {/* Section 2: Best matches for you */}
          <div className="w-full max-w-[800px] flex flex-col gap-5">
            <div className="w-full h-6 flex items-center justify-between gap-2">
              <div className="w-36 h-5 bg-ds-surface-1 rounded animate-pulse" />
              <div className="w-12 h-4 bg-ds-surface-1 rounded animate-pulse" />
            </div>
            <div className="w-full flex items-center gap-5 overflow-hidden pb-1">
              <RecommendedJobCardSkeleton />
              <RecommendedJobCardSkeleton />
              <RecommendedJobCardSkeleton />
            </div>
          </div>

          {/* Sub-filters & Vertical Job Feed List */}
          <div className="w-full flex flex-col gap-5">
            {/* Filter chips skeleton */}
            <div className="w-full flex items-center gap-2 overflow-hidden animate-pulse">
              <div className="w-24 h-9 bg-ds-surface-1 rounded-full border border-ds-border" />
              <div className="w-28 h-9 bg-ds-surface-1 rounded-full border border-ds-border" />
              <div className="w-24 h-9 bg-ds-surface-1 rounded-full border border-ds-border" />
              <div className="w-28 h-9 bg-ds-surface-1 rounded-full border border-ds-border" />
              <div className="w-24 h-9 bg-ds-surface-1 rounded-full border border-ds-border" />
            </div>

            {/* Vertical Job Cards */}
            <div className="w-full flex flex-col gap-5">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPageSkeleton;

