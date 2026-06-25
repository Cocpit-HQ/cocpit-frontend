import React, { useState, useMemo, useEffect } from 'react';
import { JobListing, ListingsCounts } from '../../types/jobs.types';
import { useInView } from '@/hooks/use-in-view';
import { Icon } from '@iconify/react';

interface ListingsTabProps {
  listings: JobListing[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loadMore?: () => void;
  counts?: ListingsCounts;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onSelectListing?: (listing: JobListing) => void;
}

export const ListingsTab: React.FC<ListingsTabProps> = ({ 
  listings, hasMore = false, isFetchingMore = false, loadMore, 
  counts = { all: 0, active: 0, closed: 0, draft: 0, inReview: 0 },
  statusFilter, onStatusFilterChange, onSelectListing 
}) => {

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Trigger loadMore when sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !isFetchingMore && loadMore) {
      loadMore();
    }
  }, [inView, hasMore, isFetchingMore, loadMore]);

  const filterChips = [
    { label: 'All', count: counts.all },
    { label: 'Active', count: counts.active },
    { label: 'Closed', count: counts.closed },
    { label: 'In review', count: counts.inReview },
    { label: 'Drafts', count: counts.draft }
  ];

  const getStatusChip = (status: string) => {
    let bg = '#F0FDF4';
    let text = '#22C55E';
    let label = 'ACTIVE';

    switch (status.toUpperCase()) {
      case 'ACTIVE':
        bg = '#F0FDF4';
        text = '#22C55E';
        label = 'ACTIVE';
        break;
      case 'IN REVIEW':
        bg = '#F1F0FF';
        text = '#4338CA';
        label = 'IN REVIEW';
        break;
      case 'DRAFT':
        bg = '#F1F3F9';
        text = '#6B7280';
        label = 'DRAFT';
        break;
      case 'CLOSED':
        bg = '#F1F3F9';
        text = '#6B7280';
        label = 'CLOSED';
        break;
      default:
        bg = '#F1F3F9';
        text = '#6B7280';
        label = status.toUpperCase();
        break;
    }

    return (
      <div
        className="flex flex-col justify-center items-center rounded-full flex-shrink-0"
        style={{
          padding: '8px',
          width: '70px',
          height: '31px',
          backgroundColor: bg,
        }}
      >
        <span
          className="font-['Poppins'] font-medium text-[10px] leading-[15px] flex items-center text-center uppercase"
          style={{ color: text }}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <div
      className="w-full max-w-[998px] h-[708px] bg-white rounded-[24px] p-[16px] flex flex-col items-start gap-[16px] box-border"
    >
      {/* Heading Frame */}
      <div className="w-full flex flex-col gap-[4px] px-0">
        <h3 className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-black">
          All Jobs
        </h3>
        <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280]">
          Total jobs - {counts.all}
        </span>
      </div>

      {/* Filter Row Frame (Frame 2608535) */}
      <div className="w-full flex flex-col items-start p-0 gap-[16px] flex-none self-stretch">
        <div className="w-full flex flex-row items-center gap-[8px] border-b border-transparent">
          {filterChips.map((chip) => {
            const isSelected = statusFilter.toLowerCase() === chip.label.toLowerCase();
            return (
              <div
                key={chip.label}
                onClick={() => onStatusFilterChange(chip.label)}
                className={`font-['Poppins'] text-[14px] leading-[20px] px-[16px] py-[8px] cursor-pointer transition-all border-b-2 ${
                  isSelected
                    ? 'text-[#6366F1] font-semibold border-[#6366F1]'
                    : 'text-[#000000] font-normal border-transparent hover:text-[#6366F1]/80'
                }`}
              >
                {chip.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Job Card List with Scroll */}
      <div className="w-full flex-1 overflow-y-auto pr-1 flex flex-col gap-[16px] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {listings.length === 0 && !isFetchingMore ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center w-full">
            <h4 className="text-gray-400 text-sm font-semibold font-['Poppins']">No listings found</h4>
            <p className="text-gray-400 text-xs font-['Poppins'] max-w-xs">
              There are no jobs matching the selected filter status.
            </p>
          </div>
        ) : (
          listings.map((item, index) => (
            <div
              key={item.id || `listing-${index}`}
              onClick={() => onSelectListing && onSelectListing(item)}
              className={`w-full flex flex-row items-center justify-between py-[16px] px-0 gap-[16px] bg-white h-[80px] flex-none border-b border-[#EEF2FF]/60 last:border-b-0 ${
                onSelectListing ? 'cursor-pointer' : ''
              }`}
            >
              {/* Text Frame (Frame 2609064) */}
              <div className="flex flex-col items-start gap-[8px] h-[48px] flex-1 min-w-0">
                <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black capitalize truncate w-full">
                  {item.title}
                </span>
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] truncate w-full">
                  {item.posted_at || item.last_edited || 'Posted recently'}
                </span>
              </div>

              {/* Status Badge */}
              {getStatusChip(item.status)}
            </div>
          ))
        )}

        {/* Infinite scroll loader trigger */}
        {hasMore ? (
          <div ref={loadMoreRef} className="w-full py-4 flex justify-center items-center flex-shrink-0">
            {isFetchingMore ? (
              <div className="flex items-center gap-2 text-indigo-500 font-medium text-xs">
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                <span>Loading more listings...</span>
              </div>
            ) : (
              <div className="h-4 w-full" />
            )}
          </div>
        ) : listings.length > 0 ? (
          <div className="w-full py-6 flex justify-center items-center flex-shrink-0">
            <span className="text-gray-400 text-xs font-['Poppins'] font-medium bg-gray-50 px-4 py-2 rounded-full">
              You've reached the end of your listings.
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ListingsTab;
