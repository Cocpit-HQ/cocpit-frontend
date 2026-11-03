import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Job } from '../../types/jobs.types';
import JobCardSkeleton from '../skeletons/JobCardSkeleton';
import { MenuIcon, UserIcon } from '@/components/icons';

interface MyApplicationsTabProps {
  jobs: Job[];
  applicationStats: { totalApplied: number; shortlisted: number };
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (status: string) => void;
  selectedDateFilter: string;
  setSelectedDateFilter: (date: string) => void;
  onApplyClick: (jobId: string) => void;
  onWithdrawClick: (jobId: string) => void;
}

// Concise date parser helper
const parseDateMs = (raw?: string): number => {
  if (!raw) return Date.now();
  const clean = raw.replace(/^[Aa]pplied\s+/, '');
  const parsed = new Date(clean).getTime();
  if (!isNaN(parsed)) return parsed;

  const str = clean.toLowerCase();
  const DAY = 24 * 60 * 60 * 1000;
  if (str.includes('hour') || str.includes('minute') || str.includes('today') || str.includes('now')) return Date.now();
  if (str.includes('day')) return Date.now() - (parseInt(str) || 1) * DAY;
  if (str.includes('week')) return Date.now() - (parseInt(str) || 1) * 7 * DAY;
  if (str.includes('month')) return Date.now() - (parseInt(str) || 1) * 30 * DAY;
  return Date.now();
};

export const MyApplicationsTab: React.FC<MyApplicationsTabProps> = ({
  jobs,
  applicationStats,
  isLoading,
  isFetchingMore,
  hasMore,
  loadMore,
  selectedStatusFilter,
  setSelectedStatusFilter,
  selectedDateFilter,
  setSelectedDateFilter,
  onWithdrawClick,
}) => {
  const router = useRouter();
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterDropdownOpen]);

  const dateFilteredJobs = useMemo(() => {
    const dp = selectedDateFilter.toLowerCase();
    if (dp === "all time") return jobs;

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const maxAge = dp === "today" ? DAY : dp === "last 7 days" ? 7 * DAY : 30 * DAY;

    return jobs.filter(j => {
      const time = parseDateMs(j.applied_at || j.applied_date_display || j.created_at || j.posted_at);
      return now - time <= maxAge;
    });
  }, [jobs, selectedDateFilter]);

  const renderStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'shortlisted') {
      return (
        <span className="px-2.5 py-0.5 bg-ds-surface-2 border border-ds-success/40 rounded-full text-ds-success ds-text-small font-medium font-dm-sans">
          Shortlisted
        </span>
      );
    }
    if (s === 'in-review' || s === 'in review') {
      return (
        <span className="px-2.5 py-0.5 bg-ds-surface-2 border border-ds-warning/40 rounded-full text-ds-warning ds-text-small font-medium font-dm-sans">
          In review
        </span>
      );
    }
    if (s === 'declined' || s === 'rejected') {
      return (
        <span className="px-2.5 py-0.5 bg-ds-surface-2 border border-ds-error/40 rounded-full text-ds-error ds-text-small font-medium font-dm-sans">
          Declined
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 bg-ds-surface-2 border border-ds-border rounded-full text-ds-text-secondary ds-text-small font-medium font-dm-sans">
        Applied
      </span>
    );
  };

  const getEmptyStateContent = () => {
    const status = selectedStatusFilter.toLowerCase();
    switch (status) {
      case 'shortlisted':
        return {
          title: 'No shortlisted applications',
          description: 'Applications shortlisted by recruiters will appear here',
        };
      case 'in review':
      case 'in-review':
        return {
          title: 'No applications in review',
          description: 'Applications currently under recruiter review will appear here.',
        };
      case 'declined':
        return {
          title: 'No declined applications',
          description: 'Applications declined by recruiters will appear here.',
        };
      case 'applied':
        return {
          title: 'No applied applications',
          description: 'Applications you apply for will appear here',
        };
      case 'all':
      default:
        return {
          title: 'No job applications yet',
          description: 'Applied jobs will appear here when you apply for a job',
        };
    }
  };

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-5 font-dm-sans">
      {/* Stats Cards Row (Figma gap-6, bg-black, border-zinc-800, 3xl bold) */}
      <div className="w-full flex items-start gap-6">
        <div className="flex-1 p-4 bg-ds-bg rounded-2xl border border-ds-border flex flex-col justify-center items-start gap-2">
          <div className="w-full text-ds-text-primary text-3xl font-bold font-dm-sans leading-10">
            {selectedDateFilter !== "All time"
              ? dateFilteredJobs.length
              : applicationStats.totalApplied || jobs.length}
          </div>
          <div className="w-full text-ds-text-primary ds-text-body font-normal">
            Total Applied
          </div>
        </div>

        <div className="flex-1 p-4 bg-ds-bg rounded-2xl border border-ds-border flex flex-col justify-center items-start gap-2">
          <div className="w-full text-ds-text-primary text-3xl font-bold font-dm-sans leading-10">
            {selectedDateFilter !== "All time"
              ? dateFilteredJobs.filter(j => (j.application_status || '').toLowerCase() === "shortlisted").length
              : applicationStats.shortlisted || 0}
          </div>
          <div className="w-full text-ds-text-primary ds-text-body font-normal">
            Shortlisted
          </div>
        </div>
      </div>

      {/* Filter Section Container (Status Tabs + 3-dots menu, NO full bottom divider) */}
      <div className="w-full flex flex-col gap-5">
        <div className="w-full pr-4 flex justify-between items-center relative select-none">
          {/* Status Filter Tabs (Figma: All, Applied, Shortlisted, In Review, Declined) */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-9">
            {["All", "Applied", "Shortlisted", "In Review", "Declined"].map((chip) => {
              const isSelected = selectedStatusFilter.toLowerCase() === chip.toLowerCase();
              return (
                <button
                  type="button"
                  key={chip}
                  onClick={() => setSelectedStatusFilter(chip)}
                  className={`relative h-9 px-3 py-1.5 flex flex-col justify-center items-center ds-text-body-1 font-medium font-dm-sans focus:outline-none transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                    isSelected ? "text-ds-text-primary" : "text-ds-text-secondary hover:text-ds-text-primary"
                  }`}
                >
                  <span>{chip}</span>
                  {isSelected && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ds-accent shadow-[0px_2px_4px_0px_rgba(255,236,230,0.08)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side: 3-dots Date Filter Dropdown (horizontal without background) */}
          <div ref={dropdownRef} className="relative shrink-0 flex items-center">
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="size-8 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer"
              aria-label="Filter by date"
            >
              <MenuIcon className="w-5 h-5 text-ds-text-primary" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 top-9 z-50 w-[108px] h-[116px] p-3 bg-ds-bg border border-ds-border rounded-lg shadow-2xl flex flex-col justify-between items-start select-none animate-in fade-in zoom-in-95 duration-100">
                {[
                  { label: "Today", val: "today" },
                  { label: "Last 7 days", val: "last 7 days" },
                  { label: "Last 30 days", val: "last 30 days" },
                ].map((item) => {
                  const isActive = selectedDateFilter === item.val;
                  return (
                    <button
                      type="button"
                      key={item.val}
                      onClick={() => {
                        // Toggle: clicking active filter resets to 'All time'
                        setSelectedDateFilter(isActive ? "All time" : item.val);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`h-5 ds-text-secondary font-normal font-dm-sans focus:outline-none transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "text-ds-accent font-medium"
                          : "text-ds-text-secondary hover:text-ds-text-primary"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Applications List (Figma gap-4, rounded-3xl p-4 row layout) */}
        <div className="w-full flex flex-col gap-4">
          {isLoading ? (
            <div className="w-full flex flex-col gap-4 py-4">
              {[1, 2, 3].map((n) => (
                <JobCardSkeleton key={n} />
              ))}
            </div>
          ) : dateFilteredJobs.length === 0 ? (
            <div className="w-full max-w-[800px] min-h-[324px] pt-[60px] pb-[120px] flex flex-col justify-center items-center gap-2 select-none animate-in fade-in duration-200">
              {/* IconFrame: 64x64px, padding 12px, bg #1A1A20 (--ds-surface-1), rounded-full */}
              <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
                <UserIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
              </div>

              {/* Text Container: Title + Subtitle */}
              <div className="flex flex-col justify-start items-center gap-2 text-center">
                <h3 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6 text-center">
                  {getEmptyStateContent().title}
                </h3>
                <p className="max-w-[340px] text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 text-center">
                  {getEmptyStateContent().description}
                </p>
              </div>
            </div>
          ) : (
            dateFilteredJobs.map((job) => {
              const statusLower = (job.application_status || '').toLowerCase();
              const isShortlisted = statusLower === 'shortlisted';
              const isDeclined = statusLower === 'declined' || statusLower === 'rejected';
              const isInReview = statusLower === 'in-review' || statusLower === 'in review';

              return (
                <div
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="w-full max-w-[800px] sm:h-[84px] p-4 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 self-stretch cursor-pointer select-none font-dm-sans"
                >
                  {/* Section 1: Job Details */}
                  <div className="w-full sm:w-[230px] sm:h-[52px] flex flex-col items-start gap-2 shrink-0 min-w-0">
                    <h3 className="w-full text-ds-text-primary text-base font-medium font-dm-sans leading-6 truncate">
                      {job.title}
                    </h3>
                    <span className="w-full text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate">
                      {job.company}
                    </span>
                  </div>

                  {/* Section 2: Application Date */}
                  <div className="w-full sm:w-[180px] sm:h-[52px] flex flex-row items-center justify-start gap-2.5 shrink-0 min-w-0">
                    <span className="text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate text-left">
                      {job.applied_date_display || `Applied ${job.posted_at || 'recently'}`}
                    </span>
                  </div>

                  {/* Section 3: Application Status */}
                  <div className="w-full sm:w-[130px] sm:h-[52px] flex flex-row items-center justify-start gap-2.5 shrink-0 min-w-0">
                    {isShortlisted ? (
                      <span className="text-ds-success text-sm font-normal font-dm-sans leading-5 text-left">
                        Shortlisted
                      </span>
                    ) : isDeclined ? (
                      <span className="text-ds-error text-sm font-normal font-dm-sans leading-5 text-left">
                        Declined
                      </span>
                    ) : isInReview ? (
                      <span className="text-ds-text-primary text-sm font-normal font-dm-sans leading-5 text-left">
                        In review
                      </span>
                    ) : (
                      <span className="text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 text-left">
                        Applied
                      </span>
                    )}
                  </div>

                  {/* Section 4: Secondary Button (Figma: 99px x 36px, px-3 py-1.5, gap 10px, rounded-[100px]) */}
                  <div className="w-full sm:w-[99px] sm:h-9 flex items-center justify-start sm:justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isShortlisted ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const params = new URLSearchParams();
                          if (job.org_id) params.set('companyId', job.org_id);
                          else if (job.recruiter_id) params.set('userId', job.recruiter_id);
                          params.set('jobContext', job.id);
                          router.push(`/messaging?${params.toString()}`);
                        }}
                        className="w-[99px] h-9 px-3 py-1.5 rounded-[100px] bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary text-base font-medium font-dm-sans leading-6 flex flex-row justify-center items-center gap-2.5 transition-all shadow-sm cursor-pointer border-none outline-none shrink-0"
                      >
                        Chat
                      </button>
                    ) : !isDeclined ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWithdrawClick(job.id);
                        }}
                        className="w-[99px] h-9 px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-base font-medium font-dm-sans leading-6 flex flex-row justify-center items-center gap-2.5 focus:outline-none transition-all active:scale-95 cursor-pointer shrink-0"
                      >
                        Withdraw
                      </button>
                    ) : (
                      <div className="w-[99px] h-9" />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="w-full flex justify-center py-4">
              <button
                type="button"
                onClick={loadMore}
                disabled={isFetchingMore}
                className="px-5 py-2 rounded-full border border-ds-border bg-ds-surface-1 text-ds-text-primary hover:bg-ds-surface-2 ds-text-small font-medium font-dm-sans focus:outline-none transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isFetchingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyApplicationsTab;
