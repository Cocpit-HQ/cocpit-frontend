import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { OpportunitiesApiResponse } from '../../types/profile-analytics.types';
import { AnalyticsErrorState } from './AnalyticsErrorState';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

import { AnalyticsFilterBar } from '../ui/AnalyticsFilterBar';
import { useAnalyticsStore } from '../../store/analytics.store';
import { useAnalyticsOpportunities } from '../../hooks/useAnalyticsOpportunities';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-ds-surface-2 rounded-lg ${className ?? ''}`} />
);

export const OpportunitiesTab = () => {
  const { filter, dateRange } = useAnalyticsStore();
  const { data, isLoading, error } = useAnalyticsOpportunities(filter, dateRange);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showAllOrganizations, setShowAllOrganizations] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTopOrgsOpen = (searchParams.get('view') === 'top-organizations') || showAllOrganizations;

  const handleOpenTopOrgs = () => {
    setShowAllOrganizations(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'Opportunities');
    params.set('view', 'top-organizations');
    router.replace(`/analytics?${params.toString()}`, { scroll: false });
  };

  const handleBackTopOrgs = () => {
    setShowAllOrganizations(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('view');
    router.replace(`/analytics?${params.toString()}`, { scroll: false });
  };

  const handleCloseTopOrgs = () => {
    setShowAllOrganizations(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('view');
    params.set('tab', 'Overview');
    useAnalyticsStore.getState().setProfileSubTab('Overview');
    router.replace(`/analytics?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTopOrgsOpen) {
        handleBackTopOrgs();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTopOrgsOpen]);

  const topOrgs = data?.topOrganizations ?? [];
  const orgIndustries = data?.organizationIndustries ?? [];
  const insights = data?.insights ?? [];

  return (
    <div className="flex flex-col w-full mt-0">
      <AnalyticsFilterBar title="Opportunity overview" allowCustom={false} />

      {/* Error state */}
      {error && !isLoading && (
        <AnalyticsErrorState message={error.message || 'An error occurred'} />
      )}

      {/* Empty State */}
      {!isLoading && !error && data && topOrgs.length === 0 && orgIndustries.length === 0 && data.topMetrics.opportunityActivity.value === '0' && data.topMetrics.repeatVisitors.count === 0 ? (
        <AnalyticsEmptyState
          title="No opportunity data yet"
          message="Recruiters or organizations haven't viewed your profile in this period. Make sure your profile is complete and open to work."
        />
      ) : !error && (
        <>
          {/* Top Metrics Row: Exact Figma Dev Mode - Fill 411.33px x Hug 129px, Radius 24px, Padding 24px */}
          <div className="flex flex-col sm:flex-row items-start p-0 gap-[24px] w-full max-w-[846.67px] mb-6">
            {/* Opportunity Activity */}
            <div className="flex flex-row justify-between items-center p-[24px] w-full sm:w-[411.33px] flex-1 h-[129px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[24px]">
              <div className="flex flex-col items-start p-0 gap-[4px] w-[216px] h-auto min-h-[72px]">
                <span className="font-['DM_Sans'] font-medium text-[12px] leading-[16px] flex items-center text-ds-text-secondary">Opportunity activity</span>
                {isLoading ? (
                  <Skeleton className="w-full h-[32px]" />
                ) : (
                  <div className="flex flex-row items-end gap-[8px] flex-wrap">
                    <span className="font-['DM_Sans'] font-semibold text-[24px] leading-[32px] flex items-center text-ds-accent">
                      {data?.topMetrics.opportunityActivity.value ?? '0'}
                    </span>
                    <span className="font-['DM_Sans'] font-medium text-[14px] leading-[24px] text-ds-accent pb-[2px]">
                      {data?.topMetrics.opportunityActivity.label ?? ''}
                    </span>
                  </div>
                )}
                {isLoading ? (
                  <Skeleton className="w-[120px] h-[16px]" />
                ) : data?.topMetrics.opportunityActivity.trend ? (
                  <span className={`font-['DM_Sans'] font-normal text-[12px] leading-[16px] flex items-center ${data.topMetrics.opportunityActivity.isPositive === null || data.topMetrics.opportunityActivity.trend === 'Stable'
                    ? 'text-ds-text-muted'
                    : data.topMetrics.opportunityActivity.isPositive
                      ? 'text-ds-success'
                      : 'text-ds-error'
                    }`}>
                    {data.topMetrics.opportunityActivity.trend} from last period
                  </span>
                ) : null}
              </div>
              {/* Overlay Circle: Exact Figma - 64px x 64px, Dark mode/Black 1 #1A1A20 (bg-ds-surface-1) */}
              <div className="flex flex-row justify-center items-center w-[64px] h-[64px] bg-ds-surface-1 rounded-full shrink-0">
                <Icon name="trending-up" className="w-[28px] h-[28px] text-ds-accent" strokeWidth={2} />
              </div>
            </div>

            {/* Repeat Visitors */}
            <div className="flex flex-row justify-between items-center p-[24px] w-full sm:w-[411.33px] flex-1 h-[129px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[24px]">
              <div className="flex flex-col items-start p-0 gap-[4px] w-[260px] h-auto min-h-[72px]">
                <span className="h-[16px] font-['DM_Sans'] font-medium text-[12px] leading-[16px] flex items-center text-ds-text-secondary">Repeat organization visitors</span>
                {isLoading ? (
                  <Skeleton className="w-[80px] h-[32px]" />
                ) : (
                  <span className="h-[32px] font-['DM_Sans'] font-semibold text-[24px] leading-[32px] flex items-center text-ds-text-primary">
                    {data?.topMetrics.repeatVisitors.percentage ?? '0%'}
                  </span>
                )}
                {isLoading ? (
                  <Skeleton className="w-[200px] h-[16px]" />
                ) : (
                  <span className="text-[12px] font-['DM_Sans'] font-normal leading-[16px] text-ds-text-secondary line-clamp-2">
                    {data?.topMetrics.repeatVisitors.count ?? 0} {data?.topMetrics.repeatVisitors.label ?? 'recruiters returned to your profile multiple times.'}
                  </span>
                )}
              </div>
              {/* Overlay Circle: Exact Figma - 64px x 64px, Dark mode/Black 1 #1A1A20 (bg-ds-surface-1) */}
              <div className="flex flex-row justify-center items-center w-[64px] h-[64px] bg-ds-surface-1 rounded-full shrink-0">
                <Icon name="ph:arrow-arc-left" className="w-[28px] h-[28px] text-ds-accent" />
              </div>
            </div>
          </div>

          {/* Middle section: Top Organizations (Show only 4) and Organization industry - Exact Figma: Fill 411.33px x Hug 300px */}
          <div className="flex flex-col sm:flex-row items-start p-0 gap-[24px] w-full max-w-[846.67px] mb-6">
            {/* Left column: Top Organizations (Only 4 shown + See all companies) */}
            <div className="flex flex-col items-start p-[16px] gap-[16px] w-full sm:w-[411.33px] flex-1 h-auto sm:h-[300px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[16px]">
              <span className="w-full h-[24px] font-['DM_Sans'] font-semibold text-[16px] leading-[24px] flex items-center text-ds-text-primary shrink-0">
                Top Organizations
              </span>
              {isLoading ? (
                <div className="flex flex-col justify-between w-full flex-1 overflow-hidden">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-[36px]" />)}
                </div>
              ) : topOrgs.length > 0 ? (
                <>
                  <div className="flex flex-col gap-[14px] sm:justify-between sm:gap-0 items-start p-0 w-full flex-1 min-h-0">
                    {topOrgs.slice(0, 4).map((org: any, idx: number) => (
                      <div key={idx} className="flex flex-row justify-between items-center p-0 gap-[10px] w-full min-h-[36px] shrink-0">
                        <div className="flex flex-row items-center p-0 gap-[10px] flex-1 min-w-0">
                          <div className="w-[36px] h-[36px] rounded-[8px] overflow-hidden flex shrink-0 bg-ds-surface-1 border border-ds-border items-center justify-center">
                            {org.icon && org.icon !== '/images/analytics/organization1.png' ? (
                              <img src={org.icon} alt={org.name} className="w-full h-full object-cover" />
                            ) : (
                              <Icon name="building-2" className="w-[18px] h-[18px] text-ds-accent" />
                            )}
                          </div>
                          <div className="flex flex-col items-start p-0 gap-[2px] flex-1 min-w-0">
                            <span className="w-full font-['DM_Sans'] font-semibold text-[15px] sm:text-[16px] leading-[20px] flex items-center text-ds-text-primary truncate block">{org.name}</span>
                            <span className="w-full font-['DM_Sans'] font-normal text-[11px] sm:text-[10px] leading-[14px] sm:leading-[12px] flex items-center text-ds-text-secondary truncate block">{org.industry}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end p-0 gap-[2px] shrink-0 max-w-[150px]">
                          <span className="font-['DM_Sans'] font-normal text-[15px] sm:text-[16px] leading-[20px] flex items-center text-ds-text-primary text-right">{org.visits}</span>
                          <span className="w-full font-['DM_Sans'] font-normal text-[13px] sm:text-[14px] leading-[16px] sm:leading-[18px] flex items-center justify-end text-ds-text-muted text-right truncate block" title={org.role}>{org.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="w-full h-[20px] flex justify-center items-center shrink-0 pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={handleOpenTopOrgs}
                      className="text-ds-accent text-[12px] font-medium font-['DM_Sans'] leading-[16px] cursor-pointer bg-transparent border-none p-0 focus:outline-none hover:underline"
                    >
                      See all companies
                    </button>
                  </div>
                </>
              ) : (
                <span className="text-[12px] text-ds-text-muted font-['DM_Sans']">No organization data for this period.</span>
              )}
            </div>

        {/* Right column: Organization industry */}
        <div className="flex flex-col items-start p-[16px] gap-[16px] w-full sm:w-[411.33px] flex-1 h-auto sm:h-[300px] bg-ds-bg border border-ds-border shadow-[0px_1px_2px_0px_rgba(99,102,241,0.08)] rounded-[16px]">
          <span className="w-full h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex items-center text-ds-text-primary">Organization industry</span>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-[36px]" />)
          ) : orgIndustries.length > 0 ? (
            <div className="flex flex-col gap-3.5 w-full">
              {orgIndustries.slice(0, 4).map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col items-start p-0 gap-[6px] w-full">
                  <div className="flex flex-row justify-between items-start p-0 w-full text-[14px] font-['DM_Sans'] leading-[20px]">
                    <span className="font-normal text-ds-text-secondary">{item.name}</span>
                    <span className="font-semibold text-ds-text-primary">{item.value}%</span>
                  </div>
                  <div className="relative w-full h-[6px] bg-ds-surface-1 rounded-full overflow-hidden">
                    <div className="h-full bg-ds-accent rounded-full transition-all duration-300" style={{ width: `${Math.min(item.value, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[12px] text-ds-text-muted font-['DM_Sans']">No industry data for this period.</span>
          )}
        </div>
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

          {/* Top Organizations Full Screen View (Exact Figma Dev Mode: 846.67px Fill, 48px Row Hug, 40px x 40px Logo, 20px x 20px Close) */}
          {isTopOrgsOpen && mounted && typeof document !== 'undefined' ? createPortal(
            <div className="fixed inset-0 z-[9999] h-[100dvh] max-h-[100dvh] w-full bg-ds-bg text-ds-text-primary font-['DM_Sans'] overflow-y-auto overflow-x-hidden scrollbar-hide select-text animate-in fade-in-90 duration-200">
              {/* Back button: 40px top/left on desktop, 16px on mobile */}
              <button
                type="button"
                onClick={handleBackTopOrgs}
                className="fixed top-[16px] left-[16px] md:top-[40px] md:left-[40px] z-50 flex items-center gap-1.5 text-[14px] font-medium font-['DM_Sans'] text-ds-text-primary cursor-pointer bg-transparent border-none p-0 focus:outline-none select-none pointer-events-auto"
                title="Go back"
              >
                <Icon name="chevron-left" className="w-[18px] h-[18px] text-ds-text-primary" />
                <span>Back</span>
              </button>

              {/* Close button: Only show on desktop (hidden on mobile per user instruction) */}
              <button
                type="button"
                onClick={handleCloseTopOrgs}
                className="hidden md:flex fixed top-[40px] right-[40px] z-50 w-[20px] h-[20px] items-center justify-center text-ds-text-primary cursor-pointer bg-transparent border-none p-0 focus:outline-none select-none pointer-events-auto"
                title="Close"
              >
                <Icon name="close" className="w-[20px] h-[20px]" />
              </button>

              {/* Main Content: 60px from top on desktop, 48px on mobile, exact Figma: 846.67px */}
              <div className="w-[846.67px] max-w-full mx-auto px-4 xl:px-0 pt-[48px] md:pt-[60px] pb-12 flex flex-col">
                {/* Title & Subtitle: Exact Figma - 8px gap between title and subtitle, 20px margin bottom */}
                <div className="flex flex-col items-start gap-[8px] w-full mb-[20px]">
                  <h2 className="text-[20px] font-semibold text-ds-text-primary font-['DM_Sans'] leading-[28px] m-0">Top Organizations</h2>
                  <p className="text-[14px] font-normal text-ds-text-secondary font-['DM_Sans'] leading-[20px] m-0">Discover the organizations making the biggest impact on Cocpit</p>
                </div>

                {/* Organizations List: Exact Figma Frame 2609284 - Fill 846.67px x Hug 48px per row */}
                <div className="flex flex-col gap-[16px] w-full">
                  {topOrgs.map((org: any, idx: number) => {
                    const orgUrl = `/organization/${org.slug || org.id || org.name.toLowerCase().replace(/\s+/g, '-')}`;
                    return (
                      <Link
                        key={idx}
                        href={orgUrl}
                        className="flex flex-row justify-between items-center w-full h-[48px] px-2 -mx-2 rounded-[8px] hover:bg-ds-surface-1/40 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-row items-center gap-[12px] flex-1 min-w-0 h-[48px]">
                          <div className="w-[40px] h-[40px] rounded-[8px] overflow-hidden flex shrink-0 bg-ds-surface-1 border border-ds-border items-center justify-center">
                            {org.icon && org.icon !== '/images/analytics/organization1.png' ? (
                              <img src={org.icon} alt={org.name} className="w-full h-full object-cover" />
                            ) : (
                              <Icon name="building-2" className="w-[20px] h-[20px] text-ds-accent" />
                            )}
                          </div>
                          <div className="flex flex-col items-start justify-center gap-0.5 flex-1 min-w-0">
                            <span className="font-['DM_Sans'] font-semibold text-[16px] leading-[24px] text-ds-text-primary truncate block">{org.name}</span>
                            <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-ds-text-secondary truncate block">{org.industry}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-0.5 shrink-0 max-w-[220px]">
                          <span className="font-['DM_Sans'] font-normal text-[16px] leading-[24px] text-ds-text-primary text-right">{org.visits}</span>
                          <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-ds-text-secondary text-right truncate block max-w-full" title={org.role}>{org.role}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body
          ) : null}
        </>
      )}
    </div>
  );
};
