import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { ContentApiResponse } from '../../types/profile-analytics.types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { AnalyticsErrorState } from './AnalyticsErrorState';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface ContentTabProps {
  data: ContentApiResponse | null;
  isLoading: boolean;
  error: string | null;
  filter: string;
  setFilter: (f: string) => void;
  sortOption: string;
  setSortOption: (s: string) => void;
  dateRange?: DateRange;
  setDateRange?: (dr: DateRange | undefined) => void;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded-lg ${className ?? ''}`} />
);

export const ContentTab = ({ data, isLoading, error, filter, setFilter, sortOption, setSortOption, dateRange, setDateRange }: ContentTabProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) setSortDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCards = data
    ? [
        { label: 'Articles views', ...data.formatPerformance.articlesViews },
        { label: 'Media views', ...data.formatPerformance.mediaViews },
        { label: 'Polls views', ...data.formatPerformance.pollsViews },
        { label: 'Text views', ...data.formatPerformance.textViews },
      ]
    : [];

  const topPosts = data?.topPosts ?? [];

  return (
    <div className="flex flex-col w-full mt-6">
      {/* Format Performance Header */}
      <div className="flex flex-row items-center py-0 gap-[10px] w-full h-[26px] mb-6">
        <span className="w-[815px] h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] flex items-center text-[#000000] flex-1">
          Content format performance
        </span>
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex flex-row items-center p-0 gap-[8px] w-[103px] h-[20px] cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="w-[75px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280]">
              {filter}
            </span>
            <Icon icon="lucide:chevron-down" className={`w-[20px] h-[20px] text-[#6B7280] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
          </div>
          {dropdownOpen && (
            <div className="absolute top-8 right-0 z-50 flex flex-col items-center p-2 w-[135px] bg-white border border-[#EEF2FF] rounded-[24px] shadow-lg">
              {['Last 7 days', 'Last 30 days', 'All time', 'Custom'].map((f) => (
                <div
                  key={f}
                  className={`flex flex-row items-center px-4 py-2 gap-[10px] w-full h-[36px] bg-white rounded-[24px] cursor-pointer hover:bg-gray-50 transition-colors ${filter === f ? 'text-[#6366F1]' : 'text-black'}`}
                  onClick={() => { setFilter(f); setDropdownOpen(false); }}
                >
                  <span className="text-[14px] font-normal font-['Poppins']">{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {filter === 'Custom' && setDateRange && (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer border border-[#EEF2FF] px-3 py-1.5 rounded-[16px] text-xs text-[#6B7280] bg-white hover:bg-gray-50 transition-colors ml-4">
                <Icon icon="lucide:calendar" className="w-[16px] h-[16px]" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span className="font-['Poppins']">
                      {dayjs(dateRange.from).format('MMM DD, YYYY')} - {dayjs(dateRange.to).format('MMM DD, YYYY')}
                    </span>
                  ) : (
                    <span className="font-['Poppins']">{dayjs(dateRange.from).format('MMM DD, YYYY')}</span>
                  )
                ) : (
                  <span className="font-['Poppins']">Select Date Range</span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <AnalyticsErrorState message={error} />
      )}

      {/* Empty State */}
      {!isLoading && !error && data && topPosts.length === 0 && formatCards.every(f => Number(f.value) === 0) ? (
        <AnalyticsEmptyState 
          title="No content data yet" 
          message="You haven't posted any content or your posts haven't received engagement in this period."
        />
      ) : !error && (
        <>
      {/* Format Cards Grid */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-row justify-between items-end p-[16px] gap-[8px] h-[88px] bg-white shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
                <Skeleton className="w-[80px] h-[40px]" />
                <Skeleton className="w-[24px] h-[24px]" />
              </div>
            ))
          : formatCards.map((format, idx) => (
              <div key={idx} className="flex flex-row justify-between items-end p-[16px] gap-[8px] h-[88px] bg-white shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
                <div className="flex flex-col items-start gap-[8px]">
                  <span className="text-[12px] font-medium text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px]">{format.label}</span>
                  <span className="text-[24px] font-semibold text-black font-['Poppins'] leading-[32px] flex items-center h-[32px]">{format.value}</span>
                </div>
                <Icon icon={format.icon} className="w-[24px] h-[24px] text-[#6B7280] stroke-[1.5px]" />
              </div>
            ))}
      </div>

      {/* Top Performing Posts Header */}
      <div className="flex flex-row justify-center items-center px-4 gap-[10px] w-full h-[46px] mb-6">
        <div className="flex flex-col justify-center items-start gap-1 flex-1 h-[46px]">
          <h3 className="text-[18px] font-medium text-black font-['Poppins'] leading-[26px] m-0 p-0">Top performing posts</h3>
          <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px]">Ranked by engagement and professional impact</span>
        </div>

        <div className="relative" ref={sortDropdownRef}>
          <div
            className="flex flex-row items-center gap-[8px] cursor-pointer h-[20px]"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          >
            <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] flex items-center leading-[16px] h-[16px]">Sort by</span>
            <Icon icon="lucide:chevron-down" className={`w-[20px] h-[20px] text-[#6B7280] transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
          </div>
          {sortDropdownOpen && (
            <div className="absolute top-8 right-0 z-50 flex flex-col items-center p-2 w-[157px] bg-white border border-[#EEF2FF] rounded-[24px] shadow-lg">
              {['Top performing', 'Most viewed', 'Most liked', 'Most shared'].map((option) => (
                <div
                  key={option}
                  className={`flex flex-row items-center px-4 py-2 gap-[10px] w-[141px] h-[36px] bg-white rounded-[24px] cursor-pointer hover:bg-gray-50 transition-colors ${sortOption === option ? 'text-[#6366F1]' : 'text-black'}`}
                  onClick={() => { setSortOption(option); setSortDropdownOpen(false); }}
                >
                  <span className="text-[14px] font-normal font-['Poppins'] leading-[20px]">{option}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Posts List */}
      <div className="flex flex-col gap-4 relative z-10">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-row items-center p-[16px] gap-[16px] w-full h-[92px] bg-white border-b border-gray-50">
                <Skeleton className="w-[60px] h-[60px] rounded-[12px]" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="w-3/4 h-[16px]" />
                  <Skeleton className="w-1/2 h-[14px]" />
                </div>
                <div className="flex gap-6">
                  <Skeleton className="w-[50px] h-[36px]" />
                  <Skeleton className="w-[50px] h-[36px]" />
                  <Skeleton className="w-[50px] h-[36px]" />
                </div>
              </div>
            ))
          : topPosts.map((post, idx) => (
              <Link href={`/analytics/post/${post.id}`} key={idx} className="flex flex-row items-center p-[16px] gap-[16px] w-full h-[92px] bg-white border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer">
                <div className="w-[60px] h-[60px] rounded-[12px] overflow-hidden shrink-0 flex items-center justify-center bg-[#EEF2FF]">
                  {post.imgSrc ? (
                    <img src={post.imgSrc} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon icon={post.icon ?? 'lucide:type'} className="w-[24px] h-[24px] text-[#6366F1]" />
                  )}
                </div>
                <div className="flex flex-col items-start w-[608px] h-[40px] flex-1">
                  <span className="w-full h-[20px] text-[14px] font-normal text-black font-['Poppins'] leading-[20px] truncate">{post.title}</span>
                  <div className="flex flex-row items-center gap-[8px] h-[20px]">
                    <span className="text-[14px] font-normal text-[#6B7280] font-['Poppins'] leading-[20px]">{post.type}</span>
                    <div className="w-[4px] h-[4px] rounded-full bg-[#6B7280]" />
                    <span className="text-[14px] font-normal text-[#6B7280] font-['Poppins'] leading-[20px]">Published on {post.date}</span>
                  </div>
                </div>
                <div className="flex flex-row justify-end items-center gap-[24px] w-[228px] h-[40px] shrink-0">
                  {[
                    { val: post.views, label: 'Views', icon: 'fluent:eye-16-regular' },
                    { val: post.likes, label: 'Likes', icon: 'lucide:thumbs-up' },
                    { val: post.shares, label: 'Shares', icon: 'lucide:share-2' },
                  ].map(({ val, label, icon }) => (
                    <div key={label} className="flex flex-col items-end gap-[4px] w-[60px] h-[40px]">
                      <span className="h-[20px] text-[14px] font-semibold text-black font-['Poppins'] leading-[20px] text-right">{val}</span>
                      <div className="flex flex-row justify-end items-center gap-[4px] w-full h-[16px]">
                        <Icon icon={icon} className="w-[14px] h-[14px] text-[#6B7280]" strokeWidth={1.5} />
                        <span className="h-[16px] text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] text-right">{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
        {!isLoading && topPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#6B7280] font-['Poppins'] text-[14px]">
            No posts found for this period.
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
