import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AudienceApiResponse, MetricWithTrend } from '../../types/profile-analytics.types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { AnalyticsErrorState } from './AnalyticsErrorState';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

import { AnalyticsFilterBar } from '../ui/AnalyticsFilterBar';
import { useAnalyticsStore } from '@/store/analytics.store';
import { useAnalyticsAudience } from '../../hooks/useAnalyticsAudience';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded-lg ${className ?? ''}`} />
);

const TrendBadge = ({ metric }: { metric: MetricWithTrend }) => {
  if (metric.trend === 'Stable') {
    return <span className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280]">Stable</span>;
  }
  return (
    <div className="flex flex-row items-center p-0 gap-[8px] h-[16px]">
      <Icon icon={metric.isPositive ? 'lucide:trending-up' : 'lucide:trending-down'} className={`w-[12px] h-[12px] ${metric.isPositive ? 'text-[#22C55E]' : 'text-[#FF6B6B]'}`} />
      <span className={`h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center ${metric.isPositive ? 'text-[#22C55E]' : 'text-[#FF6B6B]'}`}>
        {metric.trend} last period
      </span>
    </div>
  );
};

export const AudienceTab = () => {
  const { filter, dateRange } = useAnalyticsStore();
  const { data, isLoading, error } = useAnalyticsAudience(filter, dateRange);

  const [locationType, setLocationType] = useState<'Cities' | 'Countries'>('Cities');



  const locationItems = data
    ? (locationType === 'Cities' ? data.audienceLocation.cities : data.audienceLocation.countries)
    : [];

  const industries = data?.audienceIndustries ?? [];
  const insights = data?.insights ?? [];

  return (
    <div className="flex flex-col w-full mt-6">
      <AnalyticsFilterBar title="Audience overview" />

      {/* Error state */}
      {error && !isLoading && (
        <AnalyticsErrorState message={error.message || 'An error occurred'} />
      )}

      {/* Empty State */}
      {!isLoading && !error && data && locationItems.length === 0 && industries.length === 0 ? (
        <AnalyticsEmptyState 
          title="No audience data yet" 
          message="We don't have enough demographic data for your audience in this period."
        />
      ) : !error && (
        <>
      {/* Top Metrics Row */}
      <div className="flex flex-row justify-start items-start p-0 gap-[16px] w-full h-[112px] mb-6">
        {[
          { label: 'Overall reach', key: 'overallReach' },
          { label: 'Profile Views', key: 'profileViews' },
          { label: 'Engagement rate', key: 'engagementRate' },
        ].map(({ label, key }) => {
          const metric = data?.topMetrics[key as keyof typeof data.topMetrics];
          return (
            <div key={key} className="flex flex-col items-start p-[16px] gap-[8px] flex-1 h-[112px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
              <span className="h-[16px] font-['Poppins'] font-medium text-[12px] leading-[16px] flex items-center text-[#6B7280]">{label}</span>
              {isLoading ? (
                <Skeleton className="w-full h-[32px]" />
              ) : (
                <span className="w-full h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000]">
                  {String(metric?.value ?? '0')}
                </span>
              )}
              {isLoading ? <Skeleton className="w-3/4 h-[16px]" /> : metric && <TrendBadge metric={metric} />}
            </div>
          );
        })}
      </div>

      {/* Middle section: Demographics and Industries */}
      <div className="flex flex-row items-start p-0 gap-[24px] w-full h-[312px] mb-6">
        {/* Left column: Cities/Countries */}
        <div className="flex flex-col items-start p-[16px] gap-[24px] w-[468px] h-[312px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <div className="flex flex-row justify-between items-center p-0 gap-[24px] w-[436px] h-[40px]">
            <span className="w-[46px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000]">{locationType}</span>
            <div className="flex flex-row justify-center items-center p-[8px] gap-[8px] w-[188px] h-[40px] bg-[#EEF2FF] rounded-[100px]">
              <button
                onClick={() => setLocationType('Cities')}
                className={`flex flex-row justify-center items-center px-[8px] py-[4px] gap-[10px] w-[82px] h-[24px] rounded-[100px] transition-colors ${locationType === 'Cities' ? 'bg-[#FFFFFF]' : 'bg-[#EEF2FF]'}`}
              >
                <span className={`w-[34px] h-[16px] font-['Poppins'] text-[12px] leading-[16px] flex items-center ${locationType === 'Cities' ? 'font-medium text-[#6366F1]' : 'font-normal text-[#6366F1]'}`}>Cities</span>
              </button>
              <button
                onClick={() => setLocationType('Countries')}
                className={`flex flex-row justify-center items-center px-[8px] py-[4px] gap-[10px] w-[82px] h-[24px] rounded-[100px] transition-colors ${locationType === 'Countries' ? 'bg-[#FFFFFF]' : 'bg-[#EEF2FF]'}`}
              >
                <span className={`w-[58px] h-[16px] font-['Poppins'] text-[12px] leading-[16px] flex items-center ${locationType === 'Countries' ? 'font-medium text-[#6366F1]' : 'font-normal text-[#6366F1]'}`}>Countries</span>
              </button>
            </div>
          </div>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-[436px] h-[36px]" />)
            : locationItems.length > 0 ? (
                locationItems.slice(0, 4).map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-start p-0 gap-[8px] w-[436px] h-[36px]">
                    <div className="flex flex-row justify-between items-start p-0 w-[436px] h-[20px]">
                      <span className="h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-[#000000]">{item.name}</span>
                      <span className="h-[20px] font-['Poppins'] font-semibold text-[14px] leading-[20px] flex items-center text-[#000000]">{item.value}%</span>
                    </div>
                    <div className="relative w-[436px] h-[8px] bg-[#EEF2FF] rounded-[9999px]">
                      <div className="absolute top-0 left-0 h-[8px] bg-[#6366F1] rounded-[9999px]" style={{ right: `${100 - item.value}%` }} />
                    </div>
                  </div>
                ))
              ) : <span className="text-[12px] text-[#6B7280] font-['Poppins']">No data available for this period.</span>
          }
        </div>

        {/* Right column: Audience Industry */}
        <div className="flex flex-col items-start p-[16px] gap-[24px] w-[468px] h-[312px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <span className="w-[147px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000]">Audience industry</span>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-[436px] h-[36px]" />)
            : industries.length > 0
              ? industries.slice(0, 4).map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-start p-0 gap-[8px] w-[436px] h-[36px]">
                    <div className="flex flex-row justify-between items-start p-0 w-[436px] h-[20px]">
                      <span className="h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] flex items-center text-[#000000]">{item.name}</span>
                      <span className="h-[20px] font-['Poppins'] font-semibold text-[14px] leading-[20px] flex items-center text-[#000000]">{item.value}%</span>
                    </div>
                    <div className="relative w-[436px] h-[8px] bg-[#EEF2FF] rounded-[9999px]">
                      <div className="absolute top-0 left-0 h-[8px] bg-[#6366F1] rounded-[9999px]" style={{ right: `${100 - item.value}%` }} />
                    </div>
                  </div>
                ))
              : <span className="text-[12px] text-[#6B7280] font-['Poppins']">No industry data available for this period.</span>
          }
        </div>
      </div>

      {/* Insights */}
      <div className="flex flex-row items-center p-[16px] gap-[24px] w-full min-h-[138px] bg-[#FFFFFF] border border-[#EEF2FF] rounded-[24px]">
        <div className="flex flex-row justify-center items-center w-[96px] h-[96px] bg-[#EEF2FF] rounded-[12px] shrink-0">
          <Icon icon="lucide:sparkles" className="w-[40px] h-[40px] text-[#6366F1]" />
        </div>
        <div className="flex flex-col items-start p-0 gap-[8px] flex-1">
          <span className="w-full h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#6366F1]">Insights</span>
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

