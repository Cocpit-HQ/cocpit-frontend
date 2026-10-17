import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { OverviewApiResponse } from '../../types/profile-analytics.types';
import { AnalyticsErrorState } from './AnalyticsErrorState';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

import { AnalyticsFilterBar } from '../ui/AnalyticsFilterBar';
import { useAnalyticsStore } from '@/store/analytics.store';
import { useAnalyticsOverview } from '../../hooks/useAnalyticsOverview';

// Skeleton shimmer block
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded-lg ${className ?? ''}`} />
);

export const OverviewTab = () => {
  const router = useRouter();
  
  const { filter, dateRange } = useAnalyticsStore();
  const { data, isLoading, error } = useAnalyticsOverview(filter, dateRange);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-[#EEF2FF] rounded-[12px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col gap-1">
          <span className="text-[#6B7280] text-[12px] font-['Poppins'] leading-none">
            {payload[0].payload.date}
          </span>
          <span className="text-[#111827] text-[14px] font-semibold font-['Poppins'] leading-none">
            {payload[0].value} views
          </span>
        </div>
      );
    }
    return null;
  };

  // Build chart data from API response
  const chartData = data
    ? data.chart.labels.map((label: any, i: number) => ({
        date: label,
        views: data.chart.datasets[0]?.data[i] ?? 0,
      }))
    : [];

  const profileViewsValue = data ? Number(data.keyMetrics.profileViews.value) : 0;
  const profileViewsTrend = data?.keyMetrics.profileViews.trend ?? '';
  const profileViewsPositive = data?.keyMetrics.profileViews.isPositive;

  const keyMetricItems = data
    ? [
        { label: 'Search appearances', ...data.keyMetrics.searchAppearances },
        { label: 'Connection requests', ...data.keyMetrics.connectionRequests },
        { label: 'Follower growth', ...data.keyMetrics.followerGrowth },
        { label: 'Opportunity views', ...data.keyMetrics.opportunityViews },
        { label: 'Resume views', ...data.keyMetrics.resumeViews },
        { label: 'Resume downloads', ...data.keyMetrics.resumeDownloads },
      ]
    : [];

  const strengthScore = data?.profileStrength.score ?? 0;
  const strengthMessage = data?.profileStrength.message ?? '';
  const insights = data?.insights ?? [];
  const chartTip = data?.chart.tip;
  const chartStartDate = data?.chart.startDate ?? '';
  const chartEndDate = data?.chart.endDate ?? '';

  return (
    <div className="flex flex-col w-full mt-6">
      {/* Header with Filters */}
      <AnalyticsFilterBar title="Key metrics" />

      {/* Error state */}
      {error && !isLoading && (
        <AnalyticsErrorState message={error.message || 'An error occurred'} />
      )}

      {/* Empty State */}
      {!isLoading && !error && data && chartData.every((d: any) => d.views === 0) && keyMetricItems.every(m => Number(m.value) === 0) ? (
        <AnalyticsEmptyState 
          title="No analytics yet" 
          message="Your profile hasn't received any views or engagement in this period. Start connecting and posting to see your metrics grow."
        />
      ) : !error && (
        <>
          {/* Top Row: Chart and Profile Strength */}
      <div className="grid grid-cols-3 gap-6 mb-6 h-[294px]">
        {/* Chart Card */}
        <div className="col-span-2 flex flex-col justify-center items-center p-4 gap-4 bg-white shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <div className="flex flex-row justify-between items-center w-full h-[52px]">
            <div className="flex flex-col items-start gap-1 w-[75px] h-full">
              <span className="text-[12px] font-medium text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px]">Profile views</span>
              {isLoading ? (
                <Skeleton className="w-[70px] h-[32px]" />
              ) : (
                <span className="text-[24px] font-semibold text-black font-['Poppins'] leading-[32px] flex items-center h-[32px]">
                  {profileViewsValue.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex flex-row items-center pt-[6px] gap-[4px] h-[21px] rounded-full">
              {!isLoading && profileViewsTrend && profileViewsTrend !== 'Stable' && (
                <>
                  <Icon
                    icon={profileViewsPositive ? 'lucide:trending-up' : 'lucide:trending-down'}
                    className={`w-[10px] h-[10px] ${profileViewsPositive ? 'text-[#22C55E]' : 'text-[#FF6B6B]'}`}
                  />
                  <span className={`text-[10px] font-normal font-['Poppins'] leading-[15px] flex items-center h-[15px] ${profileViewsPositive ? 'text-[#22C55E]' : 'text-[#FF6B6B]'}`}>
                    {profileViewsTrend} vs last period
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex flex-col items-start w-full h-[194px]">
            <div className="w-full h-[162px] relative overflow-visible mt-2">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="views" name="Views" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              <span className="absolute top-full mt-1 left-0 text-[10px] font-normal text-[#6B7280] font-['Poppins']">{chartStartDate}</span>
              <span className="absolute top-full mt-1 right-[6px] text-[10px] font-normal text-[#6B7280] font-['Poppins']">{chartEndDate}</span>
            </div>

            <div className="flex flex-row justify-between items-center pt-[16px] w-full h-[32px]">
              <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px]">
                {chartTip ?? ''}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Completeness Card */}
        <div 
          className={`col-span-1 flex flex-col items-start p-4 gap-2 bg-white shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px] ${strengthScore < 100 ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
          onClick={() => {
            if (strengthScore < 100) {
              router.push('/profile');
            }
          }}
        >
          <div className="flex flex-col items-start gap-2 w-full h-[66px]">
            <span className="text-[12px] font-medium text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px] w-full">Profile strength</span>
            <div className="flex flex-row justify-between items-center w-full h-[26px]">
              {isLoading ? (
                <Skeleton className="w-[60px] h-[26px]" />
              ) : (
                <span className="text-[18px] font-medium text-black font-['Poppins'] leading-[26px] flex items-center">{strengthScore}%</span>
              )}
              {!isLoading && strengthScore >= 100 && (
                <Icon icon="bitcoin-icons:verify-filled" className="w-[24px] h-[24px] text-[#22C55E]" />
              )}
            </div>
          </div>
          <div className="flex flex-col justify-end items-start w-full h-[8px] relative">
            <div className="w-full h-[8px] bg-[#DADADA] rounded-full" />
            <div
              className="absolute top-0 left-0 h-[8px] rounded-full transition-all duration-500"
              style={{
                width: `${strengthScore}%`,
                backgroundColor: strengthScore >= 80 ? '#22C55E' : strengthScore >= 50 ? '#F59E0B' : '#6366F1',
              }}
            />
          </div>
          <div className="flex flex-col items-start pt-[8px] w-full">
            {isLoading ? (
              <Skeleton className="w-full h-[32px]" />
            ) : (
              <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px]">{strengthMessage}</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex flex-col justify-center items-start p-[24px] gap-[8px] h-[88px] bg-white shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
                <Skeleton className="w-[120px] h-[14px]" />
                <Skeleton className="w-[80px] h-[28px]" />
              </div>
            ))
          : keyMetricItems.map((metric, idx) => (
              <div key={idx} className="flex flex-col justify-center items-start p-[24px] gap-[8px] h-[88px] bg-white shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
                <span className="text-[12px] font-medium text-[#6B7280] font-['Poppins'] leading-[16px] flex items-center h-[16px] w-full capitalize">
                  {metric.label}
                </span>
                <div className="flex flex-row justify-between items-center w-full h-[32px]">
                  <span className="text-[24px] font-semibold text-black font-['Poppins'] leading-[32px] flex items-center h-[32px]">
                    {String(metric.value)}
                  </span>
                  {metric.trend === 'Stable' ? (
                    <span className="text-[12px] font-normal text-[#6B7280] font-['Poppins'] leading-[16px]">Stable</span>
                  ) : (
                    <div className="flex flex-row items-center gap-[8px] h-[16px]">
                      <Icon
                        icon={metric.isPositive ? 'lucide:trending-up' : 'lucide:trending-down'}
                        className={`w-[12px] h-[12px] ${metric.isPositive ? 'text-[#22C55E]' : 'text-[#FF6B6B]'}`}
                      />
                      <span className={`text-[12px] font-normal font-['Poppins'] leading-[16px] flex items-center h-[16px] ${metric.isPositive ? 'text-[#22C55E]' : 'text-[#FF6B6B]'}`}>
                        {metric.trend.replace(/[-+]/g, '')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
      </div>

      {/* Insights */}
      <div className="flex flex-row items-center p-[16px] gap-[24px] w-full min-h-[138px] bg-[#FFFFFF] border border-[#EEF2FF] rounded-[24px]">
        <div className="flex flex-row justify-center items-center w-[96px] h-[96px] bg-[#EEF2FF] rounded-[12px] shrink-0">
          <Icon icon="lucide:sparkles" className="w-[40px] h-[40px] text-[#6366F1]" />
        </div>
        <div className="flex flex-col items-start p-0 gap-[8px] flex-1">
          <span className="w-full h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#6366F1]">
            Insights
          </span>
          {isLoading ? (
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="w-3/4 h-[20px]" />
              <Skeleton className="w-2/3 h-[20px]" />
              <Skeleton className="w-1/2 h-[20px]" />
            </div>
          ) : insights.length > 0 ? (
            <ul className="flex flex-col m-0 pl-[24px] gap-0 list-disc marker:text-[#6B7280]">
              {insights.map((insight: any, i: number) => (
                <li key={i} className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-[#6B7280]">{insight}</li>
              ))}
            </ul>
          ) : (
            <span className="text-[14px] text-[#6B7280] font-['Poppins']">No insights available for this period.</span>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

