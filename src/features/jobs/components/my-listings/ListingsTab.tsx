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
  onSendOffer?: (listing: JobListing) => void;
  onCloseListing?: (id: string) => void;
  onDeleteListing?: (id: string) => void;
  isLoading?: boolean;
}

export const ListingsTab: React.FC<ListingsTabProps> = ({ 
  listings, hasMore = false, isFetchingMore = false, loadMore, 
  counts = { all: 0, active: 0, closed: 0, draft: 0, inReview: 0 },
  statusFilter, onStatusFilterChange, onSelectListing,
  onSendOffer, onCloseListing, onDeleteListing, isLoading = false
}) => {
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [jobToClose, setJobToClose] = useState<string | null>(null);

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
    let bg = 'bg-[#F0FDF4] dark:bg-[#123B23]';
    let text = 'text-[#22C55E] dark:text-[#4ADE80]';
    let label = 'ACTIVE';

    switch (status.toUpperCase()) {
      case 'ACTIVE':
        bg = 'bg-[#F0FDF4] dark:bg-[#123B23]';
        text = 'text-[#22C55E] dark:text-[#4ADE80]';
        label = 'ACTIVE';
        break;
      case 'IN REVIEW':
        bg = 'bg-[#F1F0FF] dark:bg-[#1C2340]';
        text = 'text-[#4338CA] dark:text-[#818CF8]';
        label = 'IN REVIEW';
        break;
      case 'DRAFT':
        bg = 'bg-[#F1F3F9] dark:bg-[#2E3445]';
        text = 'text-[#6B7280] dark:text-[#9CA3AF]';
        label = 'DRAFT';
        break;
      case 'CLOSED':
        bg = 'bg-[#F1F3F9] dark:bg-[#2E3445]';
        text = 'text-[#6B7280] dark:text-[#9CA3AF]';
        label = 'CLOSED';
        break;
      default:
        bg = 'bg-[#F1F3F9] dark:bg-[#2E3445]';
        text = 'text-[#6B7280] dark:text-[#9CA3AF]';
        label = status.toUpperCase();
        break;
    }

    return (
      <div
        className={`flex flex-col justify-center items-center rounded-full flex-shrink-0 ${bg}`}
        style={{
          padding: '8px',
          width: '70px',
          height: '31px',
        }}
      >
        <span
          className={`font-['Poppins'] font-medium text-[10px] leading-[15px] flex items-center text-center uppercase ${text}`}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <div
      className="w-full max-w-[998px] h-[708px] bg-white dark:bg-[#0B0F19] rounded-[24px] p-[16px] flex flex-col items-start gap-[16px] box-border"
    >
      {/* Heading Frame */}
      <div className="w-full flex flex-col gap-[4px] px-0">
        <h3 className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-black dark:text-[#F9FAFB] capitalize">
          {statusFilter === 'All' ? 'All Jobs' : statusFilter === 'Drafts' ? 'Drafts' : `${statusFilter} Jobs`}
        </h3>
        <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] dark:text-[#9CA3AF]">
          Total jobs - {filterChips.find(c => c.label.toLowerCase() === statusFilter.toLowerCase())?.count || 0}
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
                    ? 'text-[#6366F1] dark:text-[#818CF8] font-semibold border-[#6366F1] dark:border-[#818CF8]'
                    : 'text-[#000000] dark:text-[#F9FAFB] font-normal border-transparent hover:text-[#6366F1]/80 dark:hover:text-[#818CF8]/80'
                }`}
              >
                {chip.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Job Card List with Scroll */}
      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-[16px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading ? (
          [1, 2, 3, 4].map((n) => (
              <div
              key={n}
              className="w-full flex flex-row items-center justify-between py-4 px-2 sm:px-4 gap-2 sm:gap-4 bg-white dark:bg-[#0B0F19] h-[92px] flex-none rounded-[12px] animate-pulse border border-slate-100 dark:border-[#2E3445]"
            >
              <div className="flex flex-col items-start gap-2 w-1/4 h-[48px] justify-center">
                <div className="w-3/4 h-5 bg-slate-200 dark:bg-[#2E3445] rounded" />
                <div className="w-1/2 h-4 bg-slate-100 dark:bg-[#1C2340] rounded" />
              </div>
              <div className="w-[14%] h-8 bg-slate-100 dark:bg-[#1C2340] rounded-3xl" />
              <div className="w-[14%] h-8 bg-slate-100 dark:bg-[#1C2340] rounded-3xl" />
              <div className="w-[14%] h-8 bg-slate-100 dark:bg-[#1C2340] rounded-3xl" />
              <div className="w-[12%] h-[31px] bg-slate-200 dark:bg-[#2E3445] rounded-full" />
              <div className="w-[104px] flex justify-end gap-4">
                <div className="w-6 h-6 bg-slate-200 dark:bg-[#2E3445] rounded-full" />
                <div className="w-6 h-6 bg-slate-200 dark:bg-[#2E3445] rounded-full" />
              </div>
            </div>
          ))
        ) : listings.length === 0 && !isFetchingMore ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center w-full">
            <h4 className="text-gray-400 dark:text-[#9CA3AF] text-sm font-semibold font-['Poppins']">No listings found</h4>
            <p className="text-gray-400 dark:text-[#9CA3AF] text-xs font-['Poppins'] max-w-xs">
              There are no jobs matching the selected filter status.
            </p>
          </div>
        ) : (
          listings.map((item, index) => (
            <div
              key={item.id || `listing-${index}`}
              onClick={() => onSelectListing && onSelectListing(item)}
              className={`w-full flex flex-row items-center justify-between py-4 px-2 sm:px-4 gap-2 sm:gap-4 bg-white dark:bg-[#0B0F19] h-[92px] flex-none rounded-[12px] hover:bg-slate-50 dark:hover:bg-[#2E3445] transition-colors ${
                onSelectListing ? 'cursor-pointer' : ''
              }`}
            >
              {/* Job Title & Date */}
              <div className="flex flex-col items-start gap-2 w-1/4 min-w-[140px] justify-center shrink-0">
                <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black dark:text-[#F9FAFB] capitalize truncate w-full">
                  {item.title}
                </span>
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-gray-500 dark:text-[#9CA3AF] truncate w-full">
                  {item.posted_at || item.last_edited || 'Posted recently'}
                </span>
              </div>

              {/* Applications */}
              <div className="flex flex-col items-start gap-2 w-[14%] min-w-[90px] justify-center shrink-0">
                <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-black dark:text-[#F9FAFB]">
                  {item.applicants_count || 0}
                </span>
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-gray-500 dark:text-[#9CA3AF]">
                  Applications
                </span>
              </div>

              {/* Shortlisted */}
              <div className="flex flex-col items-start gap-2 w-[14%] min-w-[90px] justify-center shrink-0">
                <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-black dark:text-[#F9FAFB]">
                  {item.shortlisted_count || 0}
                </span>
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-gray-500 dark:text-[#9CA3AF]">
                  Shortlisted
                </span>
              </div>

              {/* Offer sent */}
              <div className="flex flex-col items-start gap-2 w-[14%] min-w-[90px] justify-center shrink-0">
                <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-black dark:text-[#F9FAFB]">
                  {item.offers_count || 0}
                </span>
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-gray-500 dark:text-[#9CA3AF]">
                  Offer sent
                </span>
              </div>

              {/* Status */}
              <div className="flex flex-col items-start gap-[10px] w-[12%] min-w-[80px] justify-center shrink-0">
                <span className="font-['Poppins'] font-medium text-[10px] leading-[15px] uppercase" style={{
                  color: item.status?.toUpperCase() === 'ACTIVE' ? '#22C55E' : 
                         item.status?.toUpperCase() === 'IN REVIEW' ? '#4338CA' : 
                         item.status?.toUpperCase() === 'CLOSED' ? '#EAB308' : '#6B7280'
                }}>
                  {item.status || 'DRAFT'}
                </span>
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-gray-500 dark:text-[#9CA3AF]">
                  Status
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 w-[104px] h-[60px] shrink-0" onClick={(e) => e.stopPropagation()}>
                {item.status?.toUpperCase() === 'ACTIVE' && (
                  <>
                    <button 
                      onClick={() => onSendOffer && onSendOffer(item)}
                      className="w-6 h-6 flex items-center justify-center hover:opacity-75 transition-opacity active:scale-95"
                    >
                      <Icon icon="lucide:gift" className="w-6 h-6 text-black dark:text-[#F9FAFB] stroke-[1.5px]" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setJobToClose(item.id); }}
                      className="w-6 h-6 flex items-center justify-center hover:opacity-75 transition-opacity active:scale-95"
                    >
                      <Icon icon="lucide:x-circle" className="w-6 h-6 text-black dark:text-[#F9FAFB] stroke-[1.5px]" />
                    </button>
                  </>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setJobToDelete(item.id); }}
                  className="w-6 h-6 flex items-center justify-center hover:opacity-75 transition-opacity active:scale-95"
                >
                  <Icon icon="fluent:delete-16-regular" className="w-5 h-5 text-[#FF6B6B] dark:text-[#F87171]" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Infinite scroll loader trigger */}
        {hasMore ? (
          <div ref={loadMoreRef} className="w-full py-4 flex justify-center items-center flex-shrink-0">
            {isFetchingMore ? (
              <div className="flex items-center gap-2 text-indigo-500 dark:text-[#818CF8] font-medium text-xs">
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                <span>Loading more listings...</span>
              </div>
            ) : (
              <div className="h-4 w-full" />
            )}
          </div>
        ) : listings.length > 0 ? (
          <div className="w-full py-6 flex justify-center items-center flex-shrink-0">
            <span className="text-gray-400 dark:text-[#9CA3AF] text-xs font-['Poppins'] font-medium bg-gray-50 dark:bg-[#2E3445] px-4 py-2 rounded-full">
              You've reached the end of your listings.
            </span>
          </div>
        ) : null}
      </div>

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="w-[360px] p-6 bg-white dark:bg-[#0B0F19] rounded-3xl shadow-xl flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="text-black dark:text-[#F9FAFB] text-base font-normal font-['Poppins'] leading-5">
                Are you sure you want to delete job?
              </div>
              <div className="text-gray-400 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins'] leading-4">
                This cannot be undone
              </div>
            </div>
            <div className="flex justify-center items-center gap-3 w-full mt-2">
              <button
                onClick={() => setJobToDelete(null)}
                type="button"
                className="flex-1 h-10 px-4 rounded-3xl border border-indigo-400 dark:border-[#818CF8] bg-white dark:bg-[#0B0F19] text-indigo-500 dark:text-[#818CF8] text-sm font-medium font-['Poppins'] hover:bg-slate-50 dark:hover:bg-[#2E3445] transition-all active:scale-95 flex justify-center items-center"
              >
                Cancel
              </button>
              <button
                onClick={() => { 
                  if (onDeleteListing) onDeleteListing(jobToDelete); 
                  setJobToDelete(null); 
                }}
                type="button"
                className="flex-1 h-10 px-4 rounded-3xl bg-[#FF6B6B] dark:bg-[#F87171] text-white text-sm font-medium font-['Poppins'] hover:bg-red-500 dark:hover:bg-red-400 transition-all active:scale-95 flex justify-center items-center"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {jobToClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="w-[360px] p-6 bg-white dark:bg-[#0B0F19] rounded-3xl shadow-xl flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="text-black dark:text-[#F9FAFB] text-lg font-medium font-['Poppins'] leading-6">
                Close Job?
              </div>
              <div className="text-gray-500 dark:text-[#9CA3AF] text-sm font-normal font-['Poppins'] leading-5">
                No new applicants will be able to apply after you close this job. Existing offers will remain active for 10 days.
              </div>
            </div>
            <div className="flex justify-center items-center gap-3 w-full mt-2">
              <button
                onClick={() => setJobToClose(null)}
                type="button"
                className="flex-1 h-10 px-4 rounded-3xl border border-indigo-400 dark:border-[#818CF8] bg-white dark:bg-[#0B0F19] text-indigo-500 dark:text-[#818CF8] text-sm font-medium font-['Poppins'] hover:bg-slate-50 dark:hover:bg-[#2E3445] transition-all active:scale-95 flex justify-center items-center"
              >
                Cancel
              </button>
              <button
                onClick={() => { 
                  if (onCloseListing) onCloseListing(jobToClose); 
                  setJobToClose(null); 
                }}
                type="button"
                className="flex-1 h-10 px-4 rounded-3xl bg-[#FF6B6B] dark:bg-[#F87171] text-white text-sm font-medium font-['Poppins'] hover:bg-red-500 dark:hover:bg-red-400 transition-all active:scale-95 flex justify-center items-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsTab;
