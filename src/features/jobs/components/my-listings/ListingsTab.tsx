import { formatPostedTime } from '../../utils/jobs.utils';
import React, { useState, useEffect, useRef } from 'react';
import { JobListing, ListingsCounts } from '../../types/jobs.types';
import { useInView } from '@/hooks/use-in-view';
import { Icon } from '@iconify/react';
import { MenuIcon, DeleteIcon, BriefcaseIcon } from '@/components/icons';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';
import { useBodyScrollLock } from '@/hooks';

interface ListingsTabProps {
  listings: JobListing[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loadMore?: () => void;
  counts?: ListingsCounts;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onSelectListing?: (listing: JobListing) => void;
  onViewApplicants?: (listing: JobListing) => void;
  onSendOffer?: (listing: JobListing) => void;
  onCloseListing?: (id: string) => void;
  onDeleteListing?: (id: string) => void;
  isLoading?: boolean;
}

const getMobileStatusColor = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'text-ds-success';
    case 'IN REVIEW':
    case 'IN_REVIEW':
      return 'text-ds-accent';
    case 'CLOSED':
    case 'CLOSE':
      return 'text-ds-warning';
    case 'DRAFT':
    default:
      return 'text-ds-text-muted';
  }
};

const getStatusColor = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'text-ds-success';
    case 'IN REVIEW':
    case 'IN_REVIEW':
      return 'text-ds-accent';
    case 'CLOSED':
    case 'CLOSE':
      return 'text-ds-warning';
    case 'DRAFT':
    default:
      return 'text-ds-text-muted';
  }
};

export const ListingsTab: React.FC<ListingsTabProps> = ({ 
  listings, 
  hasMore = false, 
  isFetchingMore = false, 
  loadMore, 
  counts = { all: 0, active: 0, closed: 0, draft: 0, inReview: 0 },
  statusFilter, 
  onStatusFilterChange, 
  onSelectListing,
  onViewApplicants,
  onSendOffer, 
  onCloseListing, 
  onDeleteListing, 
  isLoading = false
}) => {
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [jobToClose, setJobToClose] = useState<string | null>(null);
  const [activeMenuJobId, setActiveMenuJobId] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [mobileMenuJob, setMobileMenuJob] = useState<JobListing | null>(null);
  useBodyScrollLock(isFilterDrawerOpen || Boolean(mobileMenuJob));
  const menuRef = useRef<HTMLDivElement>(null);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuJobId(null);
      }
    };
    if (activeMenuJobId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuJobId]);

  // Trigger loadMore when sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !isFetchingMore && loadMore) {
      loadMore();
    }
  }, [inView, hasMore, isFetchingMore, loadMore]);

  // Sub-filter tabs from Figma spec
  const filterChips = [
    { label: 'All', key: 'All', count: counts.all },
    { label: 'Active', key: 'Active', count: counts.active },
    { label: 'Close', key: 'Close', count: counts.closed },
    { label: 'In Review', key: 'In Review', count: counts.inReview },
    { label: 'Draft', key: 'Draft', count: counts.draft }
  ];

  const getEmptyStateContent = () => {
    const s = statusFilter.toLowerCase();
    if (s === 'active') {
      return {
        title: 'No active jobs yet',
        description: 'Your published and active job listings will appear here.',
      };
    }
    if (s === 'close' || s === 'closed') {
      return {
        title: 'No closed jobs',
        description: 'Jobs that are no longer accepting applications will appear here.',
      };
    }
    if (s === 'in review' || s === 'in_review') {
      return {
        title: 'No jobs in review',
        description: 'Jobs currently undergoing review will appear here.',
      };
    }
    if (s === 'draft' || s === 'drafts') {
      return {
        title: 'No draft jobs',
        description: 'Jobs saved as drafts will appear here.',
      };
    }
    return {
      title: 'No active jobs yet',
      description: 'Your published and active job listings will appear here.',
    };
  };

  const emptyContent = getEmptyStateContent();
  const getCurrentTabInfo = () => {
    const s = statusFilter.toLowerCase();
    if (s === 'active') return { title: 'Active Jobs', count: counts?.active ?? 0 };
    if (s === 'close' || s === 'closed') return { title: 'Closed Jobs', count: counts?.closed ?? 0 };
    if (s === 'in review' || s === 'in_review') return { title: 'In Review Jobs', count: counts?.inReview ?? 0 };
    if (s === 'draft' || s === 'drafts') return { title: 'Draft Jobs', count: counts?.draft ?? 0 };
    return { title: 'All Jobs', count: counts?.all ?? listings.length };
  };

  const { title: tabTitle, count: tabCount } = getCurrentTabInfo();

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-4 font-dm-sans">
      {/* Mobile Section Header & Filter Row (Figma: All jobs + filter icon) */}
      <div className="flex md:hidden w-full h-10 justify-between items-center relative select-none">
        <span className="font-dm-sans font-normal text-base leading-6 text-ds-text-primary">
          {statusFilter.toLowerCase() === 'all'
            ? 'All jobs'
            : statusFilter.toLowerCase() === 'draft' || statusFilter.toLowerCase() === 'drafts'
            ? 'Draft jobs'
            : statusFilter.toLowerCase() === 'in review' || statusFilter.toLowerCase() === 'in_review'
            ? 'In review jobs'
            : `${statusFilter} jobs`}
        </span>
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          aria-label="Filter jobs"
          className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity bg-transparent border-none p-0 cursor-pointer outline-none"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H16M6 10H14M8 14H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Desktop Section Header: All Jobs & Total jobs (Desktop only) */}
      <div className="hidden md:flex w-full flex-col items-start gap-1">
        <h3 className="text-ds-text-primary ds-text-body-1 font-medium">
          {tabTitle}
        </h3>
        <span className="text-ds-text-secondary ds-text-small font-normal">
          Total jobs - {tabCount}
        </span>
      </div>

      {/* Desktop Sub-filter tabs row (Desktop only) */}
      <div className="hidden md:flex w-full items-center justify-between select-none">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-9">
          {filterChips.map((chip) => {
            const isSelected =
              statusFilter.toLowerCase() === chip.key.toLowerCase() ||
              (chip.key === 'Close' && statusFilter.toLowerCase() === 'closed') ||
              (chip.key === 'Draft' && statusFilter.toLowerCase() === 'drafts');

            return (
              <button
                type="button"
                key={chip.key}
                onClick={() => onStatusFilterChange(chip.key)}
                className={`relative h-9 px-3 py-1.5 flex flex-col justify-center items-center text-base font-medium font-dm-sans transition-colors whitespace-nowrap cursor-pointer shrink-0 focus:outline-none ${
                  isSelected ? 'text-ds-text-primary' : 'text-ds-text-secondary hover:text-ds-text-primary'
                }`}
              >
                <span>{chip.label}</span>
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-ds-accent shadow-[0px_2px_4px_0px_rgba(255,236,230,0.08)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Job Card List */}
      <div className="w-full flex flex-col gap-0 md:gap-3">
        {isLoading ? (
          [1, 2, 3].map((n) => (
            <div
              key={n}
              className="w-full py-4 border-b border-ds-border flex flex-col gap-3 animate-pulse"
            >
              <div className="w-full flex justify-between items-center">
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="w-1/3 h-5 bg-ds-surface-2 rounded" />
                  <div className="w-1/4 h-4 bg-ds-surface-2 rounded" />
                </div>
                <div className="w-16 h-4 bg-ds-surface-2 rounded-full" />
              </div>
              <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-8 bg-ds-surface-2 rounded" />
                  <div className="w-16 h-8 bg-ds-surface-2 rounded" />
                  <div className="w-16 h-8 bg-ds-surface-2 rounded" />
                </div>
                <div className="w-28 h-9 bg-ds-surface-2 rounded-full" />
              </div>
            </div>
          ))
        ) : listings.length === 0 && !isFetchingMore ? (
          <div className="w-full max-w-[800px] min-h-[324px] pt-[60px] pb-[120px] flex flex-col justify-center items-center gap-2 select-none self-stretch animate-in fade-in duration-200">
            {/* IconFrame: 64x64px, padding 12px, bg #1A1A20 (--ds-surface-1), rounded-full */}
            <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
              <BriefcaseIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
            </div>

            {/* Title: 16px semibold (600), line-height 24px, color #FFECE6 (--ds-text-primary) */}
            <h3 className="text-ds-text-primary ds-text-body-2 font-semibold font-dm-sans leading-6 text-center">
              {emptyContent.title}
            </h3>

            {/* Subtitle: 14px regular (400), line-height 20px, color #B8ADA8 (--ds-text-secondary), max-w-[306px] */}
            <p className="max-w-[306px] text-ds-text-secondary ds-text-secondary font-normal font-dm-sans leading-5 text-center">
              {emptyContent.description}
            </p>
          </div>
        ) : (
          listings.map((item, index) => {
            const statusUpper = (item.status || 'DRAFT').toUpperCase();
            const isActive = statusUpper === 'ACTIVE';
            const isDraft = statusUpper === 'DRAFT';
            const statusColor = getStatusColor(item.status);
            const isMenuOpen = activeMenuJobId === item.id;

            return (
              <React.Fragment key={item.id || `listing-${index}`}>
                {/* Mobile Job Row (Figma Frame 2609981: 360px x 64px, py-2 px-0 border-b border-ds-border) */}
                <div
                  onClick={() => onSelectListing && onSelectListing(item)}
                  className="flex md:hidden w-full h-16 py-2 px-0 justify-between items-center gap-4 cursor-pointer select-none"
                >
                  {/* Frame 2609064: Title + Date (gap: 4px) */}
                  <div className="flex-1 flex flex-col justify-center items-start gap-1 min-w-0">
                    <h4 className="w-full text-ds-text-primary text-base font-medium font-dm-sans leading-6 line-clamp-1 truncate m-0">
                      {item.title}
                    </h4>
                    <span className="text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate">
                      {formatPostedTime(item.posted_at || item.last_edited)}
                    </span>
                  </div>

                  {/* Frame 2609239: Status (top) + 3-dots menu (bottom) */}
                  <div
                    className="flex flex-col justify-center items-end gap-2 shrink-0 h-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className={`text-[10px] font-normal font-dm-sans leading-3 uppercase ${getMobileStatusColor(item.status)}`}>
                      {statusUpper === 'CLOSED' ? 'CLOSE' : statusUpper === 'IN_REVIEW' ? 'IN REVIEW' : statusUpper}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileMenuJob(item);
                      }}
                      className="w-5 h-5 flex items-center justify-end text-ds-text-secondary hover:text-ds-text-primary focus:outline-none transition-colors shrink-0 cursor-pointer bg-transparent border-none p-0"
                      aria-label="Job actions"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="5" cy="10" r="1.5" fill="currentColor" />
                        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                        <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Desktop Job Card: Preserved 100% Unchanged */}
                <div
                  onClick={() => onSelectListing && onSelectListing(item)}
                  className="hidden md:flex w-full max-w-[800px] min-h-[129px] pr-3 border-b border-ds-border flex-col justify-center items-start cursor-pointer select-none"
                >
                {/* Frame 2609981: Top Row */}
                <div className="w-full h-[68px] py-2 flex flex-row items-center justify-between gap-4 self-stretch">
                  {/* Frame 2609064: Title + Date */}
                  <div className="flex-1 h-[52px] flex flex-col justify-center items-start gap-2 self-stretch min-w-0">
                    <h4 className="w-full h-6 text-ds-text-primary text-base font-medium font-dm-sans leading-6 line-clamp-1 truncate flex items-center">
                      {item.title}
                    </h4>
                    <span className="h-5 text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate flex items-center">
                      {formatPostedTime(item.posted_at || item.last_edited)}
                    </span>
                  </div>

                  {/* Frame 2609239: Status & Action on right */}
                  <div
                    className="relative w-[59px] h-5 flex flex-row items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className={`text-[10px] font-normal font-dm-sans leading-3 uppercase flex items-center ${statusColor}`}>
                      {statusUpper === 'CLOSED' ? 'CLOSE' : statusUpper}
                    </span>

                    {isActive ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuJobId(isMenuOpen ? null : item.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-5 h-5 flex items-center justify-center text-ds-text-secondary hover:text-ds-text-primary focus:outline-none transition-colors shrink-0 cursor-pointer"
                          aria-label="Job actions"
                        >
                          <MenuIcon className="w-5 h-5 text-ds-text-secondary hover:text-ds-text-primary transition-colors shrink-0" />
                        </button>

                        {/* Dropdown Menu for Active Listing matching Figma 'Active three dot' */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-7 z-50 w-[92px] p-3 bg-ds-bg border border-ds-border rounded-[8px] shadow-2xl flex flex-col items-start gap-4 text-left select-none animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuJobId(null);
                                onSendOffer && onSendOffer(item);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="text-ds-text-secondary hover:text-ds-text-primary text-sm font-normal font-dm-sans leading-5 transition-colors cursor-pointer text-left whitespace-nowrap p-0 bg-transparent border-0 outline-none"
                            >
                              Send offer
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuJobId(null);
                                setJobToClose(item.id);
                              }}
                              className="text-ds-text-secondary hover:text-ds-text-primary text-sm font-normal font-dm-sans leading-5 transition-colors cursor-pointer text-left whitespace-nowrap p-0 bg-transparent border-0 outline-none"
                            >
                              Close Job
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuJobId(null);
                                setJobToDelete(item.id);
                              }}
                              className="text-ds-text-secondary hover:text-ds-text-primary text-sm font-normal font-dm-sans leading-5 transition-colors cursor-pointer text-left whitespace-nowrap p-0 bg-transparent border-0 outline-none"
                            >
                              Delete job
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setJobToDelete(item.id);
                        }}
                        className="w-5 h-5 flex items-center justify-center text-ds-error hover:opacity-80 focus:outline-none transition-colors shrink-0 cursor-pointer"
                        aria-label="Delete job"
                      >
                        <DeleteIcon className="w-5 h-5 text-ds-error shrink-0" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Frame 2609982: Bottom Row */}
                <div className="w-full h-[60px] flex flex-row justify-center items-center gap-3 self-stretch">
                  {/* Frame 2609980: 3 metric columns */}
                  <div className="flex-1 h-[60px] flex flex-row items-center gap-3 min-w-0">
                    {/* Frame 2608617: Applications */}
                    <div className="flex-1 h-[60px] py-2 flex flex-col justify-center items-start gap-2 rounded-3xl min-w-0">
                      <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                        {item.applicants_count || 0}
                      </span>
                      <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
                        Applications
                      </span>
                    </div>

                    {/* Frame 2609065: Shortlisted */}
                    <div className="flex-1 h-[60px] py-2 flex flex-col justify-center items-start gap-2 rounded-3xl min-w-0">
                      <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                        {item.shortlisted_count || 0}
                      </span>
                      <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
                        Shortlisted
                      </span>
                    </div>

                    {/* Frame 2609240: Offer sent */}
                    <div className="flex-1 h-[60px] py-2 flex flex-col justify-center items-start gap-2 rounded-3xl min-w-0">
                      <span className="text-ds-text-primary text-sm font-semibold font-dm-sans leading-5">
                        {item.offers_count || 0}
                      </span>
                      <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
                        Offer sent
                      </span>
                    </div>
                  </div>

                  {/* View applicants / Edit draft CTA */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewApplicants) {
                        onViewApplicants(item);
                      } else if (onSelectListing) {
                        onSelectListing(item);
                      }
                    }}
                    className="w-[143px] min-w-[143px] h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 text-ds-text-primary rounded-full text-base font-medium font-dm-sans leading-6 flex items-center justify-center whitespace-nowrap focus:outline-none transition-all active:scale-95 shadow-sm cursor-pointer shrink-0"
                  >
                    {isDraft ? 'Edit draft' : 'View applicants'}
                  </button>
                </div>
              </div>
              </React.Fragment>
            );
          })
        )}

        {/* Infinite scroll loader trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="w-full py-4 flex justify-center items-center">
            {isFetchingMore ? (
              <div className="flex items-center gap-2 text-ds-accent font-medium ds-text-small font-dm-sans">
                <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
                <span>Loading more listings...</span>
              </div>
            ) : (
              <div className="h-4 w-full" />
            )}
          </div>
        )}
      </div>

      {/* Mobile Filter Bottom Sheet Drawer: Exact Figma (393px x 232px, bg var(--ds-bg), r: 8px 8px 0 0) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-[100] md:hidden touch-none">
          {/* Overlay backdrop */}
          <div
            onClick={() => setIsFilterDrawerOpen(false)}
            className="fixed inset-0 bg-ds-bg/80 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Drawer Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[101] flex justify-center">
            <div className="w-full max-w-[393px] h-[232px] bg-ds-bg border-t border-x border-ds-border rounded-t-[8px] p-[8px_12px_24px] flex flex-col items-start gap-4 box-border shadow-2xl animate-in slide-in-from-bottom duration-200">
              {/* Drag Handle (pepicons-pop:line-x 50px x 3px var(--ds-text-muted)) */}
              <div className="w-full h-5 flex flex-col items-center justify-center shrink-0">
                <div className="w-[50px] h-[3px] bg-ds-text-muted rounded-full" />
              </div>

              {/* Filter Options List */}
              <div className="self-stretch flex flex-col items-start gap-4">
                {[
                  { label: 'All jobs', key: 'All' },
                  { label: 'Active', key: 'Active' },
                  { label: 'In review', key: 'In Review' },
                  { label: 'Closed', key: 'Close' },
                  { label: 'Draft', key: 'Draft' },
                ].map((option) => {
                  const isSelected =
                    statusFilter.toLowerCase() === option.key.toLowerCase() ||
                    (option.key === 'Close' && statusFilter.toLowerCase() === 'closed') ||
                    (option.key === 'Draft' && statusFilter.toLowerCase() === 'drafts');

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        onStatusFilterChange(option.key);
                        setIsFilterDrawerOpen(false);
                      }}
                      className={`h-5 p-0 bg-transparent border-0 outline-none cursor-pointer font-dm-sans font-normal text-sm leading-5 transition-colors text-left flex items-center ${
                        isSelected ? 'text-ds-accent' : 'text-ds-text-primary hover:text-ds-accent'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile 3-Dot More Actions Drawer: Exact Figma (393px x 160px, bg var(--ds-bg), r: 8px 8px 0 0) */}
      {mobileMenuJob && (
        <div className="fixed inset-0 z-[100] md:hidden touch-none">
          {/* Overlay backdrop */}
          <div
            onClick={() => setMobileMenuJob(null)}
            className="fixed inset-0 bg-ds-bg/80 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Drawer Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[101] flex justify-center">
            <div className="w-full max-w-[393px] h-[160px] bg-ds-bg border-t border-x border-ds-border rounded-t-[8px] p-[8px_12px_24px] flex flex-col items-start gap-4 box-border shadow-2xl animate-in slide-in-from-bottom duration-200">
              {/* Drag Handle (pepicons-pop:line-x 50px x 3px var(--ds-text-muted)) */}
              <div className="w-full h-5 flex flex-col items-center justify-center shrink-0">
                <div className="w-[50px] h-[3px] bg-ds-text-muted rounded-full" />
              </div>

              {/* Action Buttons List */}
              <div className="self-stretch flex flex-col items-start gap-4">
                {(mobileMenuJob.status || '').toUpperCase() === 'ACTIVE' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const job = mobileMenuJob;
                        setMobileMenuJob(null);
                        onSendOffer && onSendOffer(job);
                      }}
                      className="h-5 p-0 bg-transparent border-0 outline-none cursor-pointer font-dm-sans font-normal text-sm leading-5 text-ds-text-primary hover:text-ds-accent transition-colors text-left flex items-center"
                    >
                      Send offer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const jobId = mobileMenuJob.id;
                        setMobileMenuJob(null);
                        setJobToClose(jobId);
                      }}
                      className="h-5 p-0 bg-transparent border-0 outline-none cursor-pointer font-dm-sans font-normal text-sm leading-5 text-ds-text-primary hover:text-ds-accent transition-colors text-left flex items-center"
                    >
                      Close job
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const jobId = mobileMenuJob.id;
                    setMobileMenuJob(null);
                    setJobToDelete(jobId);
                  }}
                  className="h-5 p-0 bg-transparent border-0 outline-none cursor-pointer font-dm-sans font-normal text-sm leading-5 text-ds-text-primary hover:text-ds-error transition-colors text-left flex items-center"
                >
                  Delete job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal using common ActionConfirmModal */}
      <ActionConfirmModal
        isOpen={Boolean(jobToDelete)}
        onClose={() => setJobToDelete(null)}
        onConfirm={() => {
          if (jobToDelete && onDeleteListing) {
            onDeleteListing(jobToDelete);
          }
          setJobToDelete(null);
        }}
        title="Are you sure you want to delete job?"
        description="Your changes be undone"
        confirmText="Delete"
        cancelText="Cancel"
        buttonWidthClass="w-[77px]"
        modalClassName="w-[272px]"
      />

      {/* Close Confirmation Modal using common ActionConfirmModal */}
      <ActionConfirmModal
        isOpen={Boolean(jobToClose)}
        onClose={() => setJobToClose(null)}
        onConfirm={() => {
          if (jobToClose && onCloseListing) {
            onCloseListing(jobToClose);
          }
          setJobToClose(null);
        }}
        title="Are you sure you want to close job?"
        description="No new applicants will be able to apply after you close this job. Existing offers will remain active for 10 days."
        confirmText="Close"
        cancelText="Cancel"
        buttonWidthClass="w-[77px]"
        modalClassName="w-[272px]"
      />
    </div>
  );
};

export default ListingsTab;
