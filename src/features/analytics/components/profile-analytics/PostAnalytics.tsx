"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { getPostAnalytics } from '@/services/api/analytics';
import { PostAnalyticsApiResponse } from '../../types/profile-analytics.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { AnalyticsErrorState } from './AnalyticsErrorState';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

export const PostAnalytics = ({ postId, filter: initialFilter = 'Last 30 Days' }: { postId: string; filter?: string }) => {
  const [locationType, setLocationType] = useState<'Cities' | 'Countries'>('Cities');
  const [data, setData] = useState<PostAnalyticsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(initialFilter);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!postId) return;
      if (filter === 'Custom' && (!dateRange?.from || !dateRange?.to)) return;

      setIsLoading(true);
      setError(null);
      try {
        const result = await getPostAnalytics(postId, filter, dateRange);
        setData(result);
      } catch (err) {
        console.error(err);
        setError('Failed to load post analytics.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [postId, filter, dateRange]);

  const post = data?.post;
  const metrics = data?.performance;
  const directImpact = data?.directImpact;
  
  const locationItems = locationType === 'Cities' 
    ? (data?.audienceDemographics?.cities ?? []) 
    : (data?.audienceDemographics?.countries ?? []);
  
  const industries = data?.audienceDemographics?.industries ?? [];
  const postTitle = post?.title || 'Post Analytics';

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex flex-row items-center w-full mb-8">
        <Link href="/analytics" className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center mr-4 hover:bg-gray-50 transition-colors">
          <Icon icon="lucide:chevron-left" className="w-5 h-5 text-gray-700" />
        </Link>
        <div className="flex flex-col">
          <h2 className="text-[20px] font-semibold text-gray-900 font-['Poppins']">Post analytics</h2>
          <p className="text-[12px] text-gray-500 font-['Poppins']">Understand how this post performed and who engaged with it</p>
        </div>
      </div>

      {error && !isLoading && (
        <AnalyticsErrorState message={error} onRetry={() => setFilter(filter)} />
      )}

      {!isLoading && !error && data && (!metrics || metrics.impressions === 0) ? (
        <AnalyticsEmptyState 
          title="No analytics yet" 
          message="This post hasn't received any views or engagement in this period."
        />
      ) : !error && (
        <>
      {/* Content performance card */}
      <div className="border border-gray-100 rounded-[20px] p-6 shadow-sm flex flex-col mb-6 bg-white">
        <div className="flex flex-row justify-between items-center w-full mb-6">
          <h3 className="text-[16px] font-semibold text-gray-900 font-['Poppins']">Content performance</h3>
          
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex flex-row items-center gap-[8px] cursor-pointer border border-[#EEF2FF] px-3 py-1.5 rounded-full text-xs text-[#6B7280] bg-white hover:bg-gray-50 transition-colors shadow-sm"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span className="font-['Poppins'] font-normal">{filter}</span>
                <Icon icon="lucide:chevron-down" className={`w-[16px] h-[16px] text-[#6B7280] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
              </div>

              {dropdownOpen && (
                <div className="absolute top-[36px] right-0 z-50 flex flex-col items-center p-2 w-[135px] bg-white border border-[#EEF2FF] rounded-[16px] shadow-lg">
                  {['Last 7 days', 'Last 30 days', 'All time', 'Custom'].map((f) => (
                    <div
                      key={f}
                      className={`flex flex-row items-center px-4 py-2 gap-[10px] w-full h-[32px] rounded-[12px] cursor-pointer hover:bg-[#EEF2FF] transition-colors whitespace-nowrap ${
                        filter === f ? 'text-[#6366F1] font-medium' : 'text-[#6B7280]'
                      }`}
                      onClick={() => { setFilter(f); setDropdownOpen(false); }}
                    >
                      <span className="text-[12px] font-['Poppins']">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {filter === 'Custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer border border-[#EEF2FF] px-3 py-1.5 rounded-full text-xs text-[#6B7280] bg-white hover:bg-gray-50 transition-colors shadow-sm">
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
        </div>

        {/* Post preview */}
        <div className="flex flex-row gap-4 mb-8">
          <div className="w-[80px] h-[80px] bg-indigo-50 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden relative">
            {post?.mediaUrl ? (
              post.type?.toLowerCase().includes('video') ? (
                <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={post.mediaUrl} alt={postTitle} className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#EEF2FF] to-[#C7D2FE] flex items-center justify-center relative">
                <Icon icon="lucide:layout-template" className="w-8 h-8 text-[#6366F1] opacity-50" />
                {/* Mocking the UI lines from the screenshot */}
                <div className="absolute top-2 left-2 right-2 h-2 bg-white rounded-sm opacity-50" />
                <div className="absolute top-5 left-2 w-8 h-8 bg-white rounded-sm opacity-50" />
              </div>
            )}
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#EEF2FF] text-[#6366F1] text-[10px] font-medium px-2 py-0.5 rounded-[4px] font-['Poppins'] capitalize">{post?.type || 'Article post'}</span>
              <span className="text-[10px] text-gray-400 font-['Poppins']">• Published on {post?.publishedAt || '...'}</span>
            </div>
            {isLoading ? <Skeleton className="w-full h-[40px]" /> : (
              <p className="text-[14px] font-medium text-gray-900 font-['Poppins'] leading-snug line-clamp-3">
                {postTitle}
              </p>
            )}
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex flex-row justify-between w-full border-t border-gray-50 pt-6">
          {[
            { label: 'Views', value: metrics?.impressions?.toLocaleString() ?? '-' },
            { label: 'Likes', value: metrics?.likes?.toLocaleString() ?? '-' },
            { label: 'Comments', value: metrics?.comments?.toLocaleString() ?? '-' },
            { label: 'Share', value: metrics?.shares?.toLocaleString() ?? '-' },
            { label: 'Save', value: metrics?.saves?.toLocaleString() ?? '-' },
            { label: 'Engagement rate', value: metrics?.engagementRate ?? '-' },
          ].map((metric, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-['Poppins'] mb-1">{metric.label}</span>
              {isLoading ? (
                <Skeleton className="w-[40px] h-[20px]" />
              ) : (
                <span className="text-[18px] font-bold text-gray-900 font-['Poppins'] leading-none">{metric.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Middle row: Total reach and Direct impact */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Total reach */}
        <div className="border border-gray-100 rounded-[20px] p-6 shadow-sm flex flex-col bg-white overflow-hidden relative">
          <div className="flex justify-between items-start mb-6 z-10">
            <div className="flex flex-col">
              <span className="text-[12px] text-gray-500 font-medium font-['Poppins'] mb-1">Total reach</span>
              {isLoading ? (
                <Skeleton className="w-[60px] h-[24px]" />
              ) : (
                <span className="text-[24px] font-bold text-gray-900 font-['Poppins'] leading-none">{metrics?.impressions?.toLocaleString() ?? '0'}</span>
              )}
            </div>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-[10px] text-gray-400 font-['Poppins']">{filter}</span>
            </div>
          </div>
          
          <div className="flex-1 w-full relative min-h-[100px] z-10 mt-4">
            {(() => {
              const reachData = data?.reachChart?.datasets?.[0]?.data ?? [];
              const maxReach = Math.max(...reachData, 1);
              const points = reachData.map((v, i) => {
                const x = (i / Math.max(reachData.length - 1, 1)) * 400;
                const y = 90 - ((v / maxReach) * 80);
                return { x, y };
              });

              let smoothPath = '';
              if (points.length > 0) {
                smoothPath = `M ${points[0].x},${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                  const curr = points[i];
                  const next = points[i + 1];
                  const midX = (curr.x + next.x) / 2;
                  smoothPath += ` C ${midX},${curr.y} ${midX},${next.y} ${next.x},${next.y}`;
                }
              }

              const fillPath = smoothPath ? `${smoothPath} L ${points[points.length - 1].x},100 L 0,100 Z` : '';

              return (
                <svg viewBox="0 0 400 100" className="w-full h-full preserve-aspect-ratio-none absolute -left-6" style={{ width: 'calc(100% + 48px)' }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818CF8" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {fillPath && <path d={fillPath} fill="url(#reachGradient)" />}
                  {smoothPath ? (
                    <path d={smoothPath} fill="none" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
                  ) : (
                    <line x1="0" y1="90" x2="400" y2="90" stroke="#6366F1" strokeWidth="3" />
                  )}
                </svg>
              );
            })()}
          </div>
          
          {data?.reachChart && (data.reachChart.dateRangeStr || data.reachChart.labels.length > 0) && (
            <div className="flex justify-between w-full mt-4 text-[10px] text-gray-400 font-['Poppins'] z-10 relative">
              <span>{data.reachChart.dateRangeStr?.start ?? data.reachChart.labels[0]}</span>
              <span>{data.reachChart.dateRangeStr?.end ?? data.reachChart.labels[data.reachChart.labels.length - 1]}</span>
            </div>
          )}
        </div>

        {/* Direct impact */}
        <div className="border border-gray-100 rounded-[20px] p-6 shadow-sm flex flex-col bg-white">
          <div className="flex flex-col mb-6">
            <h3 className="text-[14px] font-semibold text-gray-900 font-['Poppins'] mb-1">Direct impact</h3>
            <span className="text-[10px] text-gray-400 font-['Poppins']">Actions taken directly from this post</span>
          </div>
          
          <div className="flex flex-col gap-4">
            {[
              { label: 'Profile visits', value: directImpact?.profileVisits?.value ?? '-', trend: directImpact?.profileVisits?.vsAvg ? `${directImpact.profileVisits.vsAvg} vs avg` : '-' },
              { label: 'New followers', value: directImpact?.newFollowers?.value ?? '-', trend: directImpact?.newFollowers?.vsAvg ? `${directImpact.newFollowers.vsAvg} vs avg` : '-' },
              { label: 'Opportunity views', value: directImpact?.organizationViews?.value ?? '-', trend: directImpact?.organizationViews?.vsAvg ? `${directImpact.organizationViews.vsAvg} vs avg` : '-' },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-gray-900 font-['Poppins']">{item.label}</span>
                  <span className="text-[10px] text-gray-400 font-['Poppins']">{filter}</span>
                </div>
                <div className="flex flex-col items-end">
                  {isLoading ? (
                    <Skeleton className="w-[30px] h-[14px] mb-1" />
                  ) : (
                    <span className="text-[14px] font-bold text-gray-900 font-['Poppins']">{item.value}</span>
                  )}
                  {isLoading ? (
                    <Skeleton className="w-[40px] h-[10px]" />
                  ) : (
                    <span className={`text-[10px] font-medium font-['Poppins'] ${item.trend.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>{item.trend}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audience demographics */}
      <div className="border border-gray-100 rounded-[20px] p-6 shadow-sm flex flex-col bg-white">
        <div className="flex flex-row justify-between items-center w-full mb-8">
          <h3 className="text-[14px] font-semibold text-gray-900 font-['Poppins']">Audience demographics</h3>
          <div className="flex items-center gap-1 cursor-pointer">
            <span className="text-[10px] text-gray-400 font-['Poppins']">{filter}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10">
          {/* Cities / Countries */}
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[12px] font-semibold text-gray-900 font-['Poppins']">{locationType}</span>
              <div className="flex bg-[#F3F4F6] rounded-full p-1">
                <button 
                  onClick={() => setLocationType('Cities')}
                  className={`px-3 py-0.5 text-[10px] font-medium font-['Poppins'] rounded-full transition-colors ${locationType === 'Cities' ? 'bg-white text-[#6366F1] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Cities
                </button>
                <button 
                  onClick={() => setLocationType('Countries')}
                  className={`px-3 py-0.5 text-[10px] font-medium font-['Poppins'] rounded-full transition-colors ${locationType === 'Countries' ? 'bg-white text-[#6366F1] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Countries
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-[20px]" />)
              ) : locationItems.length > 0 ? (
                locationItems.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex flex-col w-full">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-medium text-gray-900 font-['Poppins']">{item.name}</span>
                      <span className="text-[10px] font-bold text-gray-900 font-['Poppins']">{item.value}%</span>
                    </div>
                    <div className="w-full h-[4px] bg-[#EEF2FF] rounded-full overflow-hidden">
                      <div className="h-full bg-[#6366F1] rounded-full" style={{ width: `${Math.min(item.value, 100)}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-[12px] text-gray-400 font-['Poppins']">No location data available.</span>
              )}
            </div>
          </div>

          {/* Industry */}
          <div className="flex flex-col w-full">
            <span className="text-[12px] font-semibold text-gray-900 font-['Poppins'] mb-6 h-6 flex items-center">Audience industry</span>
            <div className="flex flex-col gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-[20px]" />)
              ) : industries.length > 0 ? (
                industries.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex flex-col w-full">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-medium text-gray-900 font-['Poppins']">{item.name}</span>
                      <span className="text-[10px] font-bold text-gray-900 font-['Poppins']">{item.value}%</span>
                    </div>
                    <div className="w-full h-[4px] bg-[#EEF2FF] rounded-full overflow-hidden">
                      <div className="h-full bg-[#6366F1] rounded-full" style={{ width: `${Math.min(item.value, 100)}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-[12px] text-gray-400 font-['Poppins']">No industry data available.</span>
              )}
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
