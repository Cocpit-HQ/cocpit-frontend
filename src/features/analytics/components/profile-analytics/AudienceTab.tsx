import React, { useState } from 'react';
import { Icon } from '@/components/icons';
import { MetricWithTrend } from '../../types/profile-analytics.types';
import { AnalyticsErrorState } from './AnalyticsErrorState';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';
import { AnalyticsFilterBar } from '../ui/AnalyticsFilterBar';
import { useAnalyticsStore } from '../../store/analytics.store';
import { useAnalyticsAudience } from '../../hooks/useAnalyticsAudience';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-ds-surface-2 rounded-lg ${className ?? ''}`} />
);

const TrendBadge = ({ metric }: { metric: MetricWithTrend }) => {
  if (metric.trend === 'Stable') {
    return <span className="h-[16px] font-['DM_Sans'] font-normal text-[12px] leading-[16px] flex items-center text-ds-text-muted">Stable</span>;
  }
  return (
    <div className="flex flex-row items-center p-0 gap-[8px] h-[16px]">
      <Icon name={metric.isPositive ? 'trending-up' : 'trending-down'} className={`w-[12px] h-[12px] ${metric.isPositive ? 'text-ds-success' : 'text-ds-error'}`} />
      <span className={`h-[16px] font-['DM_Sans'] font-normal text-[12px] leading-[16px] flex items-center ${metric.isPositive ? 'text-ds-success' : 'text-ds-error'}`}>
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
    <div className="flex flex-col w-full mt-0 font-['DM_Sans']">
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
        {/* Top Metrics Row: Exact Figma Dev Mode - Fill 271.56px x Hug 121px, Radius 16px, Padding 16px, Gap 8px */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] w-full max-w-[846.67px] mb-6">
          {[
            { label: 'Overall reach', key: 'overallReach' },
            { label: 'Profile Views', key: 'profileViews' },
            { label: 'Engagement rate', key: 'engagementRate' },
          ].map(({ label, key }) => {
            const metric = data?.topMetrics[key as keyof typeof data.topMetrics];
            return (
              <div 
                key={key} 
                className="flex flex-col items-start p-[16px] gap-[8px] w-full h-[121px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[16px]"
              >
                <span className="h-[16px] font-['DM_Sans'] font-medium text-[12px] leading-[16px] flex items-center text-ds-text-secondary">
                  {label}
                </span>
                {isLoading ? (
                  <Skeleton className="w-full h-[32px]" />
                ) : (
                  <span className="w-full h-[32px] font-['DM_Sans'] font-semibold text-[24px] leading-[32px] flex items-center text-ds-text-primary">
                    {String(metric?.value ?? '0')}
                  </span>
                )}
                {isLoading ? <Skeleton className="w-3/4 h-[16px]" /> : metric && <TrendBadge metric={metric} />}
              </div>
            );
          })}
        </div>

        {/* Middle section: Demographics and Industries - Exact Figma: Fill 413.33px x Hug 232px, Radius 24px, Padding 16px, Gap 20px */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] w-full max-w-[846.67px] mb-6">
          {/* Left column: Cities/Countries */}
          <div className="flex flex-col items-start p-[16px] gap-[16px] w-full h-[232px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[24px]">
            <div className="flex flex-row justify-between items-center w-full h-[32px]">
              <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex items-center text-ds-text-primary">
                {locationType}
              </span>
              <div className="flex flex-row justify-center items-center p-[2px] bg-ds-surface-1 border border-ds-border rounded-full">
                <button
                  type="button"
                  onClick={() => setLocationType('Cities')}
                  className={`flex flex-row justify-center items-center px-[12px] py-[4px] rounded-full transition-colors cursor-pointer border-none ${
                    locationType === 'Cities' ? 'bg-ds-accent text-white shadow-sm font-medium' : 'bg-transparent text-ds-text-secondary hover:text-ds-text-primary'
                  }`}
                >
                  <span className="text-[11px] font-['DM_Sans'] leading-[16px]">Cities</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('Countries')}
                  className={`flex flex-row justify-center items-center px-[12px] py-[4px] rounded-full transition-colors cursor-pointer border-none ${
                    locationType === 'Countries' ? 'bg-ds-accent text-white shadow-sm font-medium' : 'bg-transparent text-ds-text-secondary hover:text-ds-text-primary'
                  }`}
                >
                  <span className="text-[11px] font-['DM_Sans'] leading-[16px]">Countries</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-[24px]" />)
              ) : locationItems.length > 0 ? (
                locationItems.slice(0, 4).map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col w-full gap-1">
                    <div className="flex flex-row justify-between items-center w-full text-[12px] font-['DM_Sans'] leading-[16px]">
                      <span className="font-normal text-ds-text-secondary capitalize">{item.name}</span>
                      <span className="font-semibold text-ds-text-primary">{item.value}%</span>
                    </div>
                    <div className="relative w-full h-[6px] bg-ds-surface-1 rounded-full overflow-hidden">
                      <div className="h-full bg-ds-accent rounded-full transition-all duration-300" style={{ width: `${Math.min(item.value, 100)}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-[12px] text-ds-text-muted font-['DM_Sans']">No data available for this period.</span>
              )}
            </div>
          </div>

          {/* Right column: Audience Industry */}
          <div className="flex flex-col items-start p-[16px] gap-[16px] w-full h-[232px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[24px]">
            <div className="flex flex-row items-center w-full h-[32px]">
              <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex items-center text-ds-text-primary">
                Audience industry
              </span>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-[24px]" />)
              ) : industries.length > 0 ? (
                industries.slice(0, 4).map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col w-full gap-1">
                    <div className="flex flex-row justify-between items-center w-full text-[12px] font-['DM_Sans'] leading-[16px]">
                      <span className="font-normal text-ds-text-secondary capitalize">{item.name}</span>
                      <span className="font-semibold text-ds-text-primary">{item.value}%</span>
                    </div>
                    <div className="relative w-full h-[6px] bg-ds-surface-1 rounded-full overflow-hidden">
                      <div className="h-full bg-ds-accent rounded-full transition-all duration-300" style={{ width: `${Math.min(item.value, 100)}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-[12px] text-ds-text-muted font-['DM_Sans']">No industry data available for this period.</span>
              )}
            </div>
          </div>
        </div>

        {/* Insights */}
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
