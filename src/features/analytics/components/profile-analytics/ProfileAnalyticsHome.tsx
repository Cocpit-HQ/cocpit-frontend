import React, { useState, useEffect, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { OverviewTab } from './OverviewTab';
import { ContentTab } from './ContentTab';
import { AudienceTab } from './AudienceTab';
import { OpportunitiesTab } from './OpportunitiesTab';
import {
  getAnalyticsOverview,
  getAnalyticsAudience,
  getAnalyticsContent,
  getAnalyticsOpportunities,
} from '@/services/api/analytics';
import {
  OverviewApiResponse,
  AudienceApiResponse,
  ContentApiResponse,
  OpportunitiesApiResponse,
} from '../../types/profile-analytics.types';

type SubTab = 'Overview' | 'Content' | 'Audience' | 'Opportunities';

export function ProfileAnalyticsHome() {
  const [activeTab, setActiveTab] = useState<SubTab>('Overview');

  // ── Shared filter state (lifted up so filter persists across tab switches)
  const [filter, setFilter] = useState('Last 30 days');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: dayjs().subtract(14, 'days').toDate(),
    to: dayjs().toDate(),
  });
  const [sortOption, setSortOption] = useState('Top performing');

  // ── Per-tab data + loading state
  const [overviewData, setOverviewData] = useState<OverviewApiResponse | null>(null);
  const [audienceData, setAudienceData] = useState<AudienceApiResponse | null>(null);
  const [contentData, setContentData] = useState<ContentApiResponse | null>(null);
  const [opportunitiesData, setOpportunitiesData] = useState<OpportunitiesApiResponse | null>(null);

  const [overviewLoading, setOverviewLoading] = useState(false);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);

  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [audienceError, setAudienceError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(null);

  const dr = filter === 'Custom' ? { from: dateRange?.from, to: dateRange?.to } : undefined;

  // ── Fetch functions
  const fetchOverview = useCallback(async () => {
    if (filter === 'Custom' && (!dr?.from || !dr?.to)) return;
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await getAnalyticsOverview(filter, dr);
      setOverviewData(data);
    } catch {
      setOverviewError('Failed to load overview data.');
    } finally {
      setOverviewLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, dateRange]);

  const fetchAudience = useCallback(async () => {
    if (filter === 'Custom' && (!dr?.from || !dr?.to)) return;
    setAudienceLoading(true);
    setAudienceError(null);
    try {
      const data = await getAnalyticsAudience(filter, dr);
      setAudienceData(data);
    } catch {
      setAudienceError('Failed to load audience data.');
    } finally {
      setAudienceLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, dateRange]);

  const fetchContent = useCallback(async () => {
    if (filter === 'Custom' && (!dr?.from || !dr?.to)) return;
    setContentLoading(true);
    setContentError(null);
    try {
      const data = await getAnalyticsContent(filter, sortOption, dr);
      setContentData(data);
    } catch {
      setContentError('Failed to load content data.');
    } finally {
      setContentLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sortOption, dateRange]);

  const fetchOpportunities = useCallback(async () => {
    if (filter === 'Custom' && (!dr?.from || !dr?.to)) return;
    setOpportunitiesLoading(true);
    setOpportunitiesError(null);
    try {
      const data = await getAnalyticsOpportunities(filter, dr);
      setOpportunitiesData(data);
    } catch {
      setOpportunitiesError('Failed to load opportunities data.');
    } finally {
      setOpportunitiesLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, dateRange]);

  // ── Fetch on tab change / filter change
  useEffect(() => {
    if (activeTab === 'Overview') fetchOverview();
  }, [activeTab, fetchOverview]);

  useEffect(() => {
    if (activeTab === 'Audience') fetchAudience();
  }, [activeTab, fetchAudience]);

  useEffect(() => {
    if (activeTab === 'Content') fetchContent();
  }, [activeTab, fetchContent]);

  useEffect(() => {
    if (activeTab === 'Opportunities') fetchOpportunities();
  }, [activeTab, fetchOpportunities]);

  return (
    <div className="w-full">
      {/* Sub Navigation */}
      <div className="flex flex-row items-start gap-4 mb-6 overflow-x-auto scrollbar-hide">
        {(['Overview', 'Content', 'Audience', 'Opportunities'] as SubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-row justify-center items-center px-4 py-2 h-[36px] text-[14px] font-['Poppins'] whitespace-nowrap transition-colors box-border ${
              activeTab === tab
                ? 'font-semibold text-[#6366F1] border-b border-[#6366F1] drop-shadow-[0_1px_4px_rgba(99,102,241,0.08)]'
                : 'font-normal text-black rounded-[24px] hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <OverviewTab
          data={overviewData}
          isLoading={overviewLoading}
          error={overviewError}
          filter={filter}
          setFilter={setFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}
      {activeTab === 'Content' && (
        <ContentTab
          data={contentData}
          isLoading={contentLoading}
          error={contentError}
          filter={filter}
          setFilter={setFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}
      {activeTab === 'Audience' && (
        <AudienceTab
          data={audienceData}
          isLoading={audienceLoading}
          error={audienceError}
          filter={filter}
          setFilter={setFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}
      {activeTab === 'Opportunities' && (
        <OpportunitiesTab
          data={opportunitiesData}
          isLoading={opportunitiesLoading}
          error={opportunitiesError}
          filter={filter}
          setFilter={setFilter}
        />
      )}
    </div>
  );
}
