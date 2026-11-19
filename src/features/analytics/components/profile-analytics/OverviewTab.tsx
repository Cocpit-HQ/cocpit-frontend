import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { OverviewApiResponse } from '../../types/profile-analytics.types';
import { AnalyticsErrorState } from './AnalyticsErrorState';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

import { AnalyticsFilterBar } from '../ui/AnalyticsFilterBar';
import { useAnalyticsStore } from '../../store/analytics.store';
import { useAnalyticsOverview } from '../../hooks/useAnalyticsOverview';
import { useActiveProfile } from '@/context/ActiveProfileContext';

// Skeleton shimmer block
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-ds-surface-2 rounded-lg ${className ?? ''}`} />
);

export const OverviewTab = () => {
  const router = useRouter();
  const { activeProfile } = useActiveProfile();
  
  const { filter, dateRange } = useAnalyticsStore();
  const { data, isLoading, error } = useAnalyticsOverview(filter, dateRange);

  const isProfileVerified = Boolean(
    data?.profileStrength?.isVerified ??
    (activeProfile?.is_identity_verified || activeProfile?.verification_status === 'VERIFIED')
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].payload.rawViews ?? payload[0].value;
      return (
        <div className="bg-ds-surface-1 p-3 border border-ds-border rounded-[12px] shadow-lg flex flex-col gap-1 -translate-y-2 pointer-events-none z-50">
          <span className="text-ds-text-secondary text-[12px] font-['DM_Sans'] leading-none">
            {payload[0].payload.date}
          </span>
          <span className="text-ds-text-primary text-[14px] font-semibold font-['DM_Sans'] leading-none">
            {val} views
          </span>
        </div>
      );
    }
    return null;
  };

  // Build chart data from API response with gentle smoothing for Figma-like wave curve
  const chartData = React.useMemo(() => {
    if (!data?.chart?.labels?.length) return [];
    const rawData = data.chart.labels.map((label: any, i: number) => ({
      date: label,
      views: data.chart.datasets[0]?.data[i] ?? 0,
    }));

    // Moving window Gaussian-weighted smoothing to eliminate jagged needle spikes
    return rawData.map((d: any, i: number, arr: any[]) => {
      const prev2 = arr[Math.max(0, i - 2)]?.views ?? d.views;
      const prev1 = arr[Math.max(0, i - 1)]?.views ?? d.views;
      const curr = d.views;
      const next1 = arr[Math.min(arr.length - 1, i + 1)]?.views ?? d.views;
      const next2 = arr[Math.min(arr.length - 1, i + 2)]?.views ?? d.views;
      const smoothed = Math.round(0.1 * prev2 + 0.25 * prev1 + 0.3 * curr + 0.25 * next1 + 0.1 * next2);
      return {
        date: d.date,
        views: smoothed,
        rawViews: curr,
      };
    });
  }, [data]);

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
    <div className="flex flex-col w-full mt-0">
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
          {/* Top Row: Chart (500px) and Profile Strength (322.67px) - Exact Figma Dimensions */}
      <div className="flex flex-col lg:flex-row items-stretch gap-[24px] mb-[24px] w-full max-w-[846.67px]">
        {/* Chart Card: Fixed 500px x Fill 296px on desktop; order-2 on mobile */}
        <div className="w-full lg:w-[500px] shrink-0 h-[296px] flex flex-col justify-between p-[16px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[24px] order-2 lg:order-1">
          {/* Header Row */}
          <div className="flex flex-row justify-between items-center w-full h-[52px]">
            <div className="flex flex-col items-start gap-1 w-[75px] h-full">
              <span className="text-[12px] font-medium text-ds-text-secondary font-['DM_Sans'] leading-[16px] flex items-center h-[16px]">Profile views</span>
              {isLoading ? (
                <Skeleton className="w-[70px] h-[32px]" />
              ) : (
                <span className="text-[24px] font-semibold text-ds-text-primary font-['DM_Sans'] leading-[32px] flex items-center h-[32px]">
                  {profileViewsValue.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex flex-row items-center pt-[6px] gap-[4px] h-[21px] rounded-full">
              {!isLoading && profileViewsTrend && profileViewsTrend !== 'Stable' && (
                <>
                  <Icon
                    name={profileViewsPositive ? 'trending-up' : 'trending-down'}
                    className={`w-[10px] h-[10px] ${profileViewsPositive ? 'text-ds-success' : 'text-ds-error'}`}
                  />
                  <span className={`text-[10px] font-normal font-['DM_Sans'] leading-[15px] flex items-center h-[15px] ${profileViewsPositive ? 'text-ds-success' : 'text-ds-error'}`}>
                    {profileViewsTrend} vs last period
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Chart Area */}
          <div className="w-full flex-1 min-h-[115px] relative mt-1">
            <style>{`
              .recharts-active-dot,
              .recharts-active-dot * {
                clip-path: none !important;
              }
              .recharts-surface {
                overflow: visible !important;
              }
            `}</style>
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: 8, bottom: 12 }}
                  className="overflow-visible [&_.recharts-surface]:overflow-visible [&_.recharts-active-dot]:![clip-path:none] [&_.recharts-active-dot_*]:![clip-path:none]"
                >
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--ds-accent)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--ds-accent)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    content={<CustomTooltip />}
                    offset={16}
                    cursor={{ stroke: 'var(--ds-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="basis"
                    dataKey="views"
                    name="Views"
                    stroke="var(--ds-accent)"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    activeDot={{ r: 5, fill: 'var(--ds-accent-contrast)', stroke: 'var(--ds-accent)', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Date Range Row - Figma: Small body DM Sans 12px/16px 400 Text secondary */}
          <div className="flex flex-row justify-between items-center w-full h-[16px] text-[12px] font-normal text-ds-text-secondary font-['DM_Sans'] leading-[16px] mt-2">
            <span>{chartStartDate}</span>
            <span>{chartEndDate}</span>
          </div>

          {/* Tip row with exact 16px gap above it matching Figma: Small body DM Sans 12px/16px 400 Text secondary */}
          <div className="flex flex-row items-center w-full h-[16px] mt-[16px]">
            <span className="text-[12px] font-normal text-ds-text-secondary font-['DM_Sans'] leading-[16px] truncate">
              {chartTip ?? ''}
            </span>
          </div>
        </div>

        {/* Profile Completeness Card: Fixed 322.67px x Fill 296px on desktop; h-auto on mobile */}
        <div 
          className="w-full lg:w-[322.67px] shrink-0 h-auto lg:h-[296px] flex flex-col justify-start p-[16px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[24px] order-1 lg:order-2 cursor-pointer"
          onClick={() => {
            if (strengthScore < 100) {
              router.push('/profile');
            }
          }}
        >
          <div className="flex flex-col items-start gap-1 w-full">
            <span className="text-[12px] font-medium text-ds-text-secondary font-['DM_Sans'] leading-[16px] flex items-center h-[16px] w-full">Profile strength</span>
            <div className="flex flex-row justify-between items-center w-full h-[26px]">
              {isLoading ? (
                <Skeleton className="w-[60px] h-[26px]" />
              ) : (
                <span className="text-[18px] font-medium text-ds-text-primary font-['DM_Sans'] leading-[26px] flex items-center">{strengthScore}%</span>
              )}
              {!isLoading && isProfileVerified && (
                <Icon name="verify-badge" className="w-[20px] h-[20px] text-ds-success" />
              )}
            </div>
          </div>
          <div className="flex flex-col justify-end items-start w-full h-[8px] relative mt-[12px]">
            <div className="w-full h-[8px] bg-ds-surface-2 rounded-full" />
            <div
              className="absolute top-0 left-0 h-[8px] rounded-full transition-all duration-500 bg-ds-success"
              style={{
                width: `${strengthScore}%`,
              }}
            />
          </div>
          <div className="flex flex-col items-start mt-[12px] w-full">
            {isLoading ? (
              <Skeleton className="w-full h-[32px]" />
            ) : (
              <span className="text-[12px] font-normal text-ds-text-secondary font-['DM_Sans'] leading-[16px]">{strengthMessage}</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid Metrics: 3 columns on desktop, 2 columns on mobile with full-width items for follower growth & resume downloads */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-[16px] lg:gap-[24px] mb-[24px] w-full max-w-[846.67px]">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex flex-col justify-center items-start px-[24px] py-[12px] gap-[8px] h-[88px] w-full bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[16px] ${
                  idx === 2 || idx === 5 ? 'col-span-2 lg:col-span-1' : 'col-span-1'
                }`}
              >
                <Skeleton className="w-[120px] h-[14px]" />
                <Skeleton className="w-[80px] h-[40px]" />
              </div>
            ))
          : keyMetricItems.map((metric, idx) => (
              <div
                key={idx}
                className={`flex flex-col justify-center items-start px-[24px] py-[12px] gap-[8px] h-[88px] w-full bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[16px] ${
                  idx === 2 || idx === 5 ? 'col-span-2 lg:col-span-1' : 'col-span-1'
                }`}
              >
                <span className="text-[12px] font-medium text-ds-text-secondary font-['DM_Sans'] leading-[16px] flex items-center h-[16px] w-full capitalize">
                  {metric.label}
                </span>
                <div className="flex flex-row justify-between items-center w-full h-[40px]">
                  <span className="text-[32px] font-bold text-ds-text-primary font-['DM_Sans'] leading-[40px] flex items-center h-[40px]">
                    {String(metric.value)}
                  </span>
                  {metric.trend === 'Stable' ? (
                    <span className="text-[12px] font-normal text-ds-text-muted font-['DM_Sans'] leading-[16px]">Stable</span>
                  ) : (
                    <div className="flex flex-row items-center gap-[8px] h-[16px]">
                      <Icon
                        name={metric.isPositive ? 'trending-up' : 'trending-down'}
                        className={`w-[12px] h-[12px] ${metric.isPositive ? 'text-ds-success' : 'text-ds-error'}`}
                      />
                      <span className={`text-[12px] font-normal font-['DM_Sans'] leading-[16px] flex items-center h-[16px] ${metric.isPositive ? 'text-ds-success' : 'text-ds-error'}`}>
                        {metric.trend.replace(/[-+]/g, '')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
      </div>

      {/* Insights: Fill 846.67px x Hug 137px, Padding 16px, Radius 24px */}
      <div className="flex flex-col justify-center items-start p-[16px] gap-[8px] w-full max-w-[846.67px] min-h-[137px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[24px]">
        <span className="w-full h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex items-center text-ds-accent">
          Insights
        </span>
        {isLoading ? (
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="w-3/4 h-[20px]" />
            <Skeleton className="w-2/3 h-[20px]" />
            <Skeleton className="w-1/2 h-[20px]" />
          </div>
        ) : insights.length > 0 ? (
          <ul className="flex flex-col m-0 pl-[20px] gap-[4px] list-disc marker:text-ds-text-muted">
            {insights.map((insight: any, i: number) => (
              <li key={i} className="font-['DM_Sans'] font-normal text-[16px] leading-[24px] text-ds-text-secondary">{insight}</li>
            ))}
          </ul>
        ) : (
          <span className="text-[14px] text-ds-text-muted font-['DM_Sans']">No insights available for this period.</span>
        )}
      </div>
        </>
      )}
    </div>
  );
};

