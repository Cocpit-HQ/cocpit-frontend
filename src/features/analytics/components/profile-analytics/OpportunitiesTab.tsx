import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { OpportunitiesApiResponse } from '../../types/profile-analytics.types';
import { AnalyticsErrorState } from './AnalyticsErrorState';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface OpportunitiesTabProps {
  data: OpportunitiesApiResponse | null;
  isLoading: boolean;
  error: string | null;
  filter: string;
  setFilter: (f: string) => void;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded-lg ${className ?? ''}`} />
);

export const OpportunitiesTab = ({ data, isLoading, error, filter, setFilter }: OpportunitiesTabProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const topOrgs = data?.topOrganizations ?? [];
  const orgIndustries = data?.organizationIndustries ?? [];
  const insights = data?.insights ?? [];

  return (
    <div className="flex flex-col w-full mt-6">
      {/* Header */}
      <div className="flex flex-row items-center py-0 gap-[10px] w-full h-[26px] mb-6">
        <span className="w-[815px] h-[26px] font-['Poppins'] font-medium text-[18px] leading-[26px] flex items-center text-[#000000] flex-1">
          Opportunity overview
        </span>
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex flex-row items-center p-0 gap-[8px] w-[103px] h-[20px] cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="w-[75px] h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280]">{filter}</span>
            <Icon icon="lucide:chevron-down" className={`w-[20px] h-[20px] text-[#6B7280] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
          </div>
          {dropdownOpen && (
            <div className="absolute top-8 right-0 z-50 flex flex-col items-center p-2 w-[135px] bg-white border border-[#EEF2FF] rounded-[24px] shadow-lg">
              {['Last 7 days', 'Last 30 days', 'All time'].map((f) => (
                <div
                  key={f}
                  className={`flex flex-row items-center px-4 py-2 gap-[10px] w-full h-[36px] bg-white rounded-[24px] cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap ${filter === f ? 'text-[#6366F1]' : 'text-black'}`}
                  onClick={() => { setFilter(f); setDropdownOpen(false); }}
                >
                  <span className="text-[14px] font-normal font-['Poppins']">{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <AnalyticsErrorState message={error} />
      )}

      {/* Empty State */}
      {!isLoading && !error && data && topOrgs.length === 0 && orgIndustries.length === 0 && data.topMetrics.opportunityActivity.value === '0' && data.topMetrics.repeatVisitors.count === 0 ? (
        <AnalyticsEmptyState 
          title="No opportunity data yet" 
          message="Recruiters or organizations haven't viewed your profile in this period. Make sure your profile is complete and open to work."
        />
      ) : !error && (
        <>
      {/* Top Metrics Row */}
      <div className="flex flex-row items-start p-0 gap-[24px] w-full h-[120px] mb-6">
        {/* Opportunity Activity */}
        <div className="flex flex-row justify-between items-center p-[24px] w-[468px] h-[120px] bg-[#F9FAFF] rounded-[24px]">
          <div className="flex flex-col items-start p-0 gap-[4px] w-[216px] h-auto min-h-[72px]">
            <span className="font-['Poppins'] font-medium text-[12px] leading-[16px] flex items-center text-[#000000]">Opportunity activity</span>
            {isLoading ? (
              <Skeleton className="w-full h-[32px]" />
            ) : (
              <div className="flex flex-row items-end gap-[8px] flex-wrap">
                <span className="font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#6366F1]">
                  {data?.topMetrics.opportunityActivity.value ?? '0'}
                </span>
                <span className="font-['Poppins'] font-medium text-[14px] leading-[24px] text-[#6366F1] pb-[2px]">
                  {data?.topMetrics.opportunityActivity.label ?? ''}
                </span>
              </div>
            )}
            {isLoading ? (
              <Skeleton className="w-[120px] h-[16px]" />
            ) : data?.topMetrics.opportunityActivity.trend ? (
              <span className={`font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center ${
                data.topMetrics.opportunityActivity.isPositive === null || data.topMetrics.opportunityActivity.trend === 'Stable'
                  ? 'text-[#6B7280]'
                  : data.topMetrics.opportunityActivity.isPositive
                    ? 'text-[#22C55E]'
                    : 'text-[#EF4444]'
              }`}>
                {data.topMetrics.opportunityActivity.trend} from last period
              </span>
            ) : null}
          </div>
          <div className="flex flex-row justify-center items-center w-[64px] h-[64px] bg-white/20 rounded-full">
            <Icon icon="lucide:trending-up" className="w-[30px] h-[30px] text-[#2F2EBE]" strokeWidth={2} />
          </div>
        </div>

        {/* Repeat Visitors */}
        <div className="flex flex-row justify-between items-center p-[24px] w-[468px] h-[120px] bg-[#FFFFFF] shadow-[0_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <div className="flex flex-col items-start p-0 gap-[4px] w-[304px] h-[72px]">
            <span className="h-[16px] font-['Poppins'] font-medium text-[12px] leading-[16px] flex items-center text-[#6B7280]">Repeat organization visitors</span>
            {isLoading ? (
              <Skeleton className="w-[80px] h-[32px]" />
            ) : (
              <span className="h-[32px] font-['Poppins'] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000]">
                {data?.topMetrics.repeatVisitors.percentage ?? '0%'}
              </span>
            )}
            {isLoading ? (
              <Skeleton className="w-[200px] h-[16px]" />
            ) : (
              <span className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280]">
                {data?.topMetrics.repeatVisitors.count ?? 0} {data?.topMetrics.repeatVisitors.label ?? 'recruiters returned to your profile multiple times.'}
              </span>
            )}
          </div>
          <div className="flex flex-row justify-center items-center w-[48px] h-[48px] bg-[#EEF2FF] rounded-[9999px]">
            <Icon icon="hugeicons:repost" className="w-[24px] h-[24px] text-[#6366F1]" />
          </div>
        </div>
      </div>

      {/* Middle section: Top Organizations and Organization industry */}
      <div className="flex flex-row items-start p-0 gap-[24px] w-full h-[312px] mb-6">
        {/* Left column: Top Organizations */}
        <div className="flex flex-col items-start p-[16px] gap-[16px] w-[468px] h-[312px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <span className="w-[436px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000]">Top Organizations</span>
          {isLoading
            ? (
                <div className="flex flex-col gap-[16px] w-full overflow-hidden">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-[40px]" />)}
                </div>
              )
            : topOrgs.length > 0
              ? (
                  <div className="flex flex-col items-start p-0 gap-[16px] w-full flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {topOrgs.map((org, idx) => (
                      <div key={idx} className="flex flex-row justify-between items-center p-0 gap-[8px] w-full h-[40px] shrink-0">
                        <div className="flex flex-row items-center p-0 gap-[8px] flex-1 h-[40px]">
                          <div className="w-[40px] h-[40px] rounded-[8px] overflow-hidden flex shrink-0 bg-[#EEF2FF] items-center justify-center">
                            {org.icon && org.icon !== '/images/analytics/organization1.png' ? (
                              <img src={org.icon} alt={org.name} className="w-full h-full object-cover" />
                            ) : (
                              <Icon icon="lucide:building-2" className="w-[20px] h-[20px] text-[#6366F1]" />
                            )}
                          </div>
                          <div className="flex flex-col items-start p-0 gap-[4px] flex-1 h-[39px] min-w-0">
                            <span className="w-full h-[20px] font-['Poppins'] font-semibold text-[14px] leading-[20px] flex items-center text-[#000000] truncate block">{org.name}</span>
                            <span className="w-full h-[15px] font-['Poppins'] font-normal text-[10px] leading-[15px] flex items-center text-[#6B7280] truncate block">{org.industry}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end p-0 gap-[4px] shrink-0 h-[35px] max-w-[150px]">
                          <span className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#000000] text-right">{org.visits}</span>
                          <span className="w-full h-[15px] font-['Poppins'] font-normal text-[10px] leading-[15px] flex items-center justify-end text-[#6B7280] text-right truncate block">{org.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              : <span className="text-[12px] text-[#6B7280] font-['Poppins']">No organization data for this period.</span>
          }
        </div>

        {/* Right column: Organization industry */}
        <div className="flex flex-col items-start p-[16px] gap-[24px] w-[468px] h-[312px] bg-[#FFFFFF] shadow-[0px_1px_2px_rgba(99,102,241,0.08)] rounded-[24px]">
          <span className="w-[175px] h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000]">Organization industry</span>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-[436px] h-[36px]" />)
            : orgIndustries.length > 0
              ? orgIndustries.slice(0, 4).map((item, idx) => (
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
              : <span className="text-[12px] text-[#6B7280] font-['Poppins']">No industry data for this period.</span>
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
            </div>
          ) : insights.length > 0 ? (
            <ul className="flex flex-col m-0 pl-[24px] gap-0 list-disc marker:text-[#6B7280]">
              {insights.map((insight, i) => (
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
