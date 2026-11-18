'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  Briefcase,
  MapPin,
} from 'lucide-react';
import { FeedPost } from '@/features/feed/components/FeedPost';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import {
  StageAResponse,
  SearchCategory,
  SearchPersonItem,
  SearchCompanyItem,
  SearchInstituteItem,
} from '../../types/search.types';
import { SearchSectionError } from '../cards/SearchSectionError';
import { SearchActionButton } from '../buttons/SearchActionButton';
import Avatar from '@/components/shared/Avatar';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { formatJobLocation } from '@/features/jobs/utils/location.utils';
import { cleanSalary } from '@/features/jobs/utils/currency.utils';
import { formatExperience } from '@/features/jobs/services/jobs.service';

interface SearchAllViewProps {
  data?: StageAResponse;
  query: string;
  onSelectCategory: (category: SearchCategory) => void;
  onRetryCategory?: (category: SearchCategory) => void;
  returnTo?: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="w-full text-base font-medium font-dm-sans text-ds-text-primary mb-4 md:mb-0">
      {children}
    </h2>
  );
}

function SeeAll({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-full flex justify-center mt-2 md:mt-0 pt-1">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-center rounded-full bg-ds-surface-1 hover:bg-ds-surface-2 transition-colors px-4 py-1.5 md:h-9 md:px-3 md:py-[6px] gap-1 cursor-pointer select-none border-none outline-none"
      >
        <span className="text-sm md:text-base font-medium font-dm-sans text-ds-text-primary">See all</span>
        <ChevronRight className="w-4 h-4 text-ds-text-primary shrink-0" />
      </button>
    </div>
  );
}

function formatRelativeTime(dateString?: string | null): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMin <= 1) return 'Just now';
        return `${diffMin}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    const diffYears = Math.floor(diffDays / 365);
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  } catch {
    return null;
  }
}

function PersonRow({
  person,
  returnTo,
}: {
  person: SearchPersonItem;
  returnTo?: string;
}) {
  const returnParam = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
  const profileUrl =
    (person.account_name ? `/profile/${person.account_name}` : `/profile/${person.id}`) + returnParam;
  const headline = person.headline || '';
  const context =
    person.context_signal ||
    (person.mutual_connections && person.mutual_connections > 0
      ? `${person.mutual_connections} mutual connection${person.mutual_connections === 1 ? '' : 's'}`
      : '');

  return (
    <div className="w-full flex items-center justify-between py-1 md:py-2 rounded-2xl transition-colors group">
      <Link href={profileUrl} className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar
          src={person.avatar_url || ''}
          name={person.name}
          className="size-8 rounded-full shrink-0 object-cover"
        />
        <div className="flex flex-col justify-center gap-0.5 md:gap-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0 max-w-[200px] sm:max-w-[400px]">
            <span className="text-sm font-normal font-dm-sans text-ds-text-primary group-hover:text-ds-accent transition-colors shrink-0 max-w-[120px] sm:max-w-[220px] truncate">
              {person.name}
            </span>
            {headline && (
              <>
                <div className="size-1 rounded-full bg-ds-text-muted shrink-0" />
                <span className="text-xs font-normal font-dm-sans text-ds-text-secondary truncate shrink min-w-0 max-w-[120px] sm:max-w-[240px]">
                  {headline}
                </span>
              </>
            )}
          </div>
          {context && (
            <span className="text-xs font-medium font-dm-sans text-ds-text-secondary truncate max-w-[220px] sm:max-w-[400px]">
              {context}
            </span>
          )}
        </div>
      </Link>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <SearchActionButton
          entityType="person"
          targetId={person.id}
          targetName={person.name}
          isFollowing={person.is_following}
          connectionStatus={person.connection_status}
          connectionsCount={person.connections_count}
          pendingRequestId={person.pending_request_id}
          isSelf={person.is_self}
          className="w-auto px-4 py-1.5 text-sm h-auto md:w-[89px] md:h-[36px] md:text-base md:px-[12px] md:py-[6px]"
        />
      </div>
    </div>
  );
}

function CompactJobCard({
  job,
  onClick,
  onApply,
}: {
  job: any;
  onClick: () => void;
  onApply: (e: React.MouseEvent) => void;
}) {
  const isCompanyPoster = Boolean(job.org_id);
  const companyName = isCompanyPoster
    ? (job.company || job.company_name || job.recruiter_name)
    : (job.recruiter_name || job.company || job.company_name);
  const logoUrl = isCompanyPoster
    ? (job.company_logo || job.logo_url || job.organization?.logo_url || job.recruiter_avatar)
    : (job.recruiter_avatar || job.company_logo || job.logo_url);
  const salaryText = cleanSalary(
    job.salary_display ||
    (job.salary_min && job.salary_max
      ? `${job.salary_min}–${job.salary_max}`
      : job.salary_min || job.salary_max || '')
  );

  const experienceText = formatExperience(
    job.experience_min,
    job.experience_max,
    job.experience_level,
    job.experience_label || job.experience
  );

  const isApplied = Boolean(job.is_applied || job.hasApplied);
  const postedTime = job.posted_at || formatRelativeTime(job.created_at);

  return (
    <>
      {/* Mobile Job Card (< md) */}
      <div
        onClick={onClick}
        className="md:hidden w-full flex flex-col justify-between py-1 bg-transparent group cursor-pointer"
      >
        {/* Row 1: Logo (Left) + Bookmark (Right) */}
        <div className="w-full flex items-center justify-between">
          <Avatar
            src={logoUrl || ''}
            name={companyName || 'Company'}
            isCompany={isCompanyPoster}
            fallbackIcon={<Briefcase className="size-5 text-ds-text-primary shrink-0" />}
            className="size-10 rounded-lg shrink-0 object-cover"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="text-ds-text-primary hover:text-ds-accent transition-colors bg-transparent border-none outline-none p-0 cursor-pointer"
            aria-label="Save job"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Row 2: Details on Left + Salary & Apply Button on Right */}
        <div className="w-full flex items-end justify-between gap-3 mt-2.5">
          {/* Details Column */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h3 className="text-base font-medium font-dm-sans text-ds-text-primary group-hover:text-ds-accent transition-colors truncate">
              {job.title}
            </h3>
            {companyName && (
              <p className="text-sm font-normal font-dm-sans text-ds-text-secondary truncate">
                {companyName}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-ds-text-secondary flex-wrap">
              {experienceText && (
                <span className="flex items-center gap-1 shrink-0">
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <span>{experienceText}</span>
                </span>
              )}
              {job.work_mode && (
                <span className="flex items-center gap-1 shrink-0">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{job.work_mode}</span>
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1 shrink-0">
                  <span className="w-1 h-1 rounded-full bg-ds-text-muted shrink-0" />
                  <span className="truncate">{formatJobLocation(job.location)}</span>
                </span>
              )}
            </div>
            {postedTime && (
              <p className="text-xs text-ds-text-secondary mt-1">
                {postedTime}
              </p>
            )}
          </div>

          {/* Salary & Action Button Column */}
          <div className="flex flex-col items-end gap-2 text-right shrink-0">
            {salaryText && (
              <span className="text-lg font-bold font-dm-sans text-ds-text-primary whitespace-nowrap">
                {salaryText}
              </span>
            )}
            <button
              type="button"
              onClick={onApply}
              className={`px-4 py-1.5 rounded-full text-sm font-medium font-dm-sans transition-all cursor-pointer select-none shrink-0 whitespace-nowrap ${
                isApplied
                  ? 'border border-ds-border bg-transparent text-ds-text-primary'
                  : 'bg-ds-accent hover:bg-ds-accent-hover text-ds-text-primary'
              }`}
            >
              {isApplied ? 'Applied' : 'Apply now'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Job Card (>= md) */}
      <div
        onClick={onClick}
        className="hidden md:flex w-full h-[156px] flex-col justify-between p-3 gap-3 rounded-2xl border border-ds-border bg-ds-bg box-border hover:border-ds-border-subtle transition-all cursor-pointer group"
      >
        {/* Frame 2609818: Logo Row (h: 40px) */}
        <div className="w-full h-10 flex items-start justify-between">
          <Avatar
            src={logoUrl || ''}
            name={companyName || 'Company'}
            isCompany={isCompanyPoster}
            fallbackIcon={<Briefcase className="size-5 text-ds-text-primary shrink-0" />}
            className="size-10 shrink-0"
          />
        </div>

        {/* Frame 2609958: Details & Salary Row (h: 80px) */}
        <div className="w-full h-20 flex items-end justify-between gap-3">
          {/* Frame 2609957: Left Column (h: 80px, gap: 12px) */}
          <div className="flex flex-col items-start justify-between h-full min-w-0 flex-1">
            {/* Frame 2609814: Title & Company (gap: 4px) */}
            <div className="flex flex-col items-start gap-1 min-w-0">
              <h3 className="text-base font-medium font-dm-sans leading-6 text-ds-text-primary group-hover:text-ds-accent transition-colors truncate">
                {job.title}
              </h3>
              {companyName && (
                <span className="text-sm font-normal font-dm-sans leading-5 text-ds-text-secondary truncate">
                  {companyName}
                </span>
              )}
            </div>

            {/* Frame 2609816: Metadata Row (gap: 8px) */}
            <div className="flex items-center gap-2 text-sm font-normal font-dm-sans leading-5 text-ds-text-secondary flex-wrap">
              {experienceText && (
                <div className="flex items-center gap-2 shrink-0">
                  <Briefcase className="size-4 text-ds-text-secondary shrink-0" />
                  <span>{experienceText}</span>
                </div>
              )}
              {job.work_mode && (
                <div className="flex items-center gap-2 shrink-0">
                  <MapPin className="size-4 text-ds-text-secondary shrink-0" />
                  <span>{job.work_mode}</span>
                </div>
              )}
              {job.location && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="size-1 rounded-full bg-ds-text-muted shrink-0" />
                  <span className="truncate">{formatJobLocation(job.location)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Frame 2609956: Right Column (w: 104px, h: 80px, gap: 12px) */}
          <div className="w-[104px] h-full flex flex-col items-end justify-end gap-3 shrink-0">
            {salaryText && (
              <span className="text-[18px] font-bold font-dm-sans leading-6 text-ds-text-primary text-right whitespace-nowrap">
                {salaryText}
              </span>
            )}
            <button
              type="button"
              onClick={onApply}
              className={`min-w-[104px] h-[36px] flex items-center justify-center rounded-[100px] px-3.5 py-1.5 text-base font-medium font-dm-sans leading-6 transition-all cursor-pointer select-none shrink-0 whitespace-nowrap ${
                isApplied
                  ? 'border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary'
                  : 'bg-ds-accent hover:bg-ds-accent-hover text-ds-text-primary'
              }`}
            >
              {isApplied ? 'Applied' : 'Job details'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function CompanyRow({
  company,
  returnTo,
}: {
  company: SearchCompanyItem;
  returnTo?: string;
}) {
  const { isCompany } = useActiveProfile();
  const returnParam = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
  const orgUrl = `/organization/${company.slug || company.id}` + returnParam;
  const logoUrl = company.logo || company.logo_url;
  const isEmploymentSignal = Boolean(
    company.context_signal && (
      company.context_signal.includes('work here') ||
      company.context_signal.includes('worked here')
    )
  );
  const subtitle = isCompany
    ? (company.headline || (!isEmploymentSignal ? company.context_signal : null) || company.industry || 'Company')
    : (company.context_signal || company.headline || company.industry || 'Company');

  return (
    <div className="w-full flex items-center justify-between py-1 md:py-2 rounded-2xl transition-colors group">
      <Link href={orgUrl} className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar
          src={logoUrl || ''}
          name={company.name}
          isCompany={true}
          className="size-10 rounded-lg shrink-0 object-cover"
        />
        <div className="flex flex-col justify-center gap-1 min-w-0">
          <span className="text-sm font-normal font-dm-sans text-ds-text-primary group-hover:text-ds-accent transition-colors truncate">
            {company.name}
          </span>
          <span className="text-xs font-normal font-dm-sans text-ds-text-secondary truncate">
            {subtitle}
          </span>
        </div>
      </Link>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <SearchActionButton
          entityType="company"
          targetId={company.id}
          targetName={company.name}
          isFollowing={company.is_following}
          messagePermission={company.message_permission}
          messagesEnabled={company.messages_enabled}
          isSelf={company.is_self}
          className="w-auto px-4 py-1.5 text-sm h-auto md:w-[89px] md:h-[36px] md:text-base md:px-[12px] md:py-[6px]"
        />
      </div>
    </div>
  );
}

function InstituteRow({
  institute,
  returnTo,
}: {
  institute: SearchInstituteItem;
  returnTo?: string;
}) {
  const { isCompany } = useActiveProfile();
  const returnParam = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
  const orgUrl = `/organization/${institute.slug || institute.id}` + returnParam;
  const logoUrl = institute.logo || institute.logo_url;
  const isEducationSignal = Boolean(
    institute.context_signal && (
      institute.context_signal.includes('studied here') ||
      institute.context_signal.includes('alumni') ||
      institute.context_signal.includes('alumnus')
    )
  );
  const subtitle = isCompany
    ? (institute.headline || (!isEducationSignal ? institute.context_signal : null) || institute.institution_type || 'Institute')
    : (institute.context_signal || institute.headline || institute.institution_type || 'Institute');

  return (
    <div className="w-full flex items-center justify-between py-1 md:py-2 rounded-2xl transition-colors group">
      <Link href={orgUrl} className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar
          src={logoUrl || ''}
          name={institute.name}
          isCompany={true}
          className="size-10 rounded-lg shrink-0 object-cover"
        />
        <div className="flex flex-col justify-center gap-1 min-w-0">
          <span className="text-sm font-normal font-dm-sans text-ds-text-primary group-hover:text-ds-accent transition-colors truncate">
            {institute.name}
          </span>
          <span className="text-xs font-normal font-dm-sans text-ds-text-secondary truncate">
            {subtitle}
          </span>
        </div>
      </Link>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <SearchActionButton
          entityType="institute"
          targetId={institute.id}
          targetName={institute.name}
          isFollowing={institute.is_following}
          messagePermission={institute.message_permission}
          messagesEnabled={institute.messages_enabled}
          isSelf={institute.is_self}
          className="w-auto px-4 py-1.5 text-sm h-auto md:w-[89px] md:h-[36px] md:text-base md:px-[12px] md:py-[6px]"
        />
      </div>
    </div>
  );
}

/* [DEPRECATED / SUPERSEDED]: PostPreviewItem replaced with canonical <FeedPost /> component from feed. */

export const SearchAllView: React.FC<SearchAllViewProps> = ({
  data,
  query,
  onSelectCategory,
  onRetryCategory,
  returnTo,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCompany, activeProfile } = useActiveProfile();
  const isOrgActor = Boolean(
    isCompany ||
    activeProfile?.type === 'COMPANY' ||
    (activeProfile as any)?.type === 'ORGANIZATION' ||
    (activeProfile as any)?.type === 'ORG' ||
    activeProfile?.entityType === 'COMPANY' ||
    activeProfile?.entityType === 'INSTITUTION' ||
    (typeof window !== 'undefined' && (() => {
      try {
        const stored = sessionStorage.getItem('cocpit_active_profile');
        if (!stored) return false;
        const p = JSON.parse(stored);
        return p?.type === 'COMPANY' || p?.type === 'ORGANIZATION' || p?.entityType === 'COMPANY' || p?.entityType === 'INSTITUTION';
      } catch {
        return false;
      }
    })())
  );

  const currentSearchUrl = useMemo(() => {
    if (returnTo) return returnTo;
    const qStr = searchParams?.toString();
    return qStr ? `/search?${qStr}` : `/search?q=${encodeURIComponent(query)}&type=all`;
  }, [returnTo, searchParams, query]);

  const results =
    data?.results ||
    (data as any)?.sections ||
    (data as any)?.data?.results ||
    (data as any)?.data?.sections;

  const people = results?.people?.items || [];
  const rawJobs = results?.jobs?.items || [];
  const jobs = isOrgActor ? [] : rawJobs;
  const hasJobsError = !isOrgActor && results?.jobs?.status === 'error';
  const companies = results?.companies?.items || [];
  const institutes = results?.institutes?.items || [];
  const posts = results?.posts?.items || [];
  const hashtags = results?.hashtags?.items || [];

  const hasAnyResults =
    people.length > 0 ||
    jobs.length > 0 ||
    companies.length > 0 ||
    institutes.length > 0 ||
    posts.length > 0 ||
    hashtags.length > 0;

  if (!hasAnyResults && data) {
    return (
      <div className="w-full max-w-[602px] mx-auto px-4 py-16 text-center">
        <h3 className="text-ds-text-primary text-base font-medium font-dm-sans mb-1">
          No results found for &ldquo;{query}&rdquo;
        </h3>
        <p className="text-ds-text-secondary text-sm font-dm-sans">
          Try searching for different keywords, names, or job titles.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[602px] mx-auto flex flex-col items-center gap-0 md:gap-5 pb-20">
      {/* 1. People Section */}
      {(people.length > 0 || results?.people?.status === 'error') && (
        <section className="w-full flex flex-col items-center px-4 py-4 md:px-0 md:py-0 md:gap-3">
          <SectionTitle>People</SectionTitle>
          {results?.people?.status === 'error' ? (
            <SearchSectionError title="People" onRetry={() => onRetryCategory?.('people')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-4 md:gap-2">
              {people.map((person: SearchPersonItem) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  returnTo={currentSearchUrl}
                />
              ))}
            </div>
          )}
          {people.length > 0 && <SeeAll onClick={() => onSelectCategory('people')} />}
        </section>
      )}

      {/* Divider */}
      {(people.length > 0 || results?.people?.status === 'error') &&
        (jobs.length > 0 || hasJobsError || companies.length > 0 || results?.companies?.status === 'error' || institutes.length > 0 || posts.length > 0 || hashtags.length > 0) && (
          <hr className="border-t border-ds-border w-full my-0" />
      )}

      {/* 2. Jobs Section (User actor only) */}
      {!isOrgActor && (jobs.length > 0 || hasJobsError) && (
        <section className="w-full flex flex-col items-center px-4 py-4 md:px-0 md:py-0 md:gap-3">
          <SectionTitle>Jobs</SectionTitle>
          {results?.jobs?.status === 'error' ? (
            <SearchSectionError title="Jobs" onRetry={() => onRetryCategory?.('jobs')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-6 md:gap-3">
              {jobs.map((job: any, index: number) => (
                <CompactJobCard
                  key={job.id || job.job_id || `job-${index}`}
                  job={job}
                  onClick={() =>
                    router.push(
                      `/jobs/${job.id || job.job_id}?returnTo=${encodeURIComponent(currentSearchUrl)}`
                    )
                  }
                  onApply={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/jobs/${job.id || job.job_id}?returnTo=${encodeURIComponent(currentSearchUrl)}`
                    );
                  }}
                />
              ))}
            </div>
          )}
          {jobs.length > 0 && <SeeAll onClick={() => onSelectCategory('jobs')} />}
        </section>
      )}

      {/* Divider */}
      {!isOrgActor && (jobs.length > 0 || hasJobsError) &&
        (companies.length > 0 || results?.companies?.status === 'error' || institutes.length > 0 || posts.length > 0 || hashtags.length > 0) && (
          <hr className="border-t border-ds-border w-full my-0" />
      )}

      {/* 3. Companies Section */}
      {(companies.length > 0 || results?.companies?.status === 'error') && (
        <section className="w-full flex flex-col items-center px-4 py-4 md:px-0 md:py-0 md:gap-3">
          <SectionTitle>Companies</SectionTitle>
          {results?.companies?.status === 'error' ? (
            <SearchSectionError title="Companies" onRetry={() => onRetryCategory?.('companies')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-4 md:gap-2">
              {companies.map((company: SearchCompanyItem) => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  returnTo={currentSearchUrl}
                />
              ))}
            </div>
          )}
          {companies.length > 0 && <SeeAll onClick={() => onSelectCategory('companies')} />}
        </section>
      )}

      {/* Divider */}
      {(companies.length > 0 || results?.companies?.status === 'error') &&
        (institutes.length > 0 || results?.institutes?.status === 'error' || posts.length > 0 || hashtags.length > 0) && (
          <hr className="border-t border-ds-border w-full my-0" />
      )}

      {/* 4. Institutes Section */}
      {(institutes.length > 0 || results?.institutes?.status === 'error') && (
        <section className="w-full flex flex-col items-center px-4 py-4 md:px-0 md:py-0 md:gap-3">
          <SectionTitle>Institutes</SectionTitle>
          {results?.institutes?.status === 'error' ? (
            <SearchSectionError title="Institutes" onRetry={() => onRetryCategory?.('institutes')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-4 md:gap-2">
              {institutes.map((institute: SearchInstituteItem) => (
                <InstituteRow
                  key={institute.id}
                  institute={institute}
                  returnTo={currentSearchUrl}
                />
              ))}
            </div>
          )}
          {institutes.length > 0 && <SeeAll onClick={() => onSelectCategory('institutes')} />}
        </section>
      )}

      {/* Divider */}
      {(institutes.length > 0 || results?.institutes?.status === 'error') &&
        (posts.length > 0 || results?.posts?.status === 'error' || hashtags.length > 0) && (
          <hr className="border-t border-ds-border w-full my-0" />
      )}

      {/* 5. Posts Section */}
      {(posts.length > 0 || results?.posts?.status === 'error') && (
        <section className="w-full flex flex-col items-start py-4 md:py-0 md:gap-3">
          <div className="w-full px-4 md:px-0">
            <SectionTitle>Posts</SectionTitle>
          </div>
          {results?.posts?.status === 'error' ? (
            <div className="w-full px-4 md:px-0">
              <SearchSectionError title="Posts" onRetry={() => onRetryCategory?.('posts')} />
            </div>
          ) : (
            <div className="w-full flex flex-col items-start gap-6 md:gap-3">
              {posts.map((post: any, index: number) => {
                if (!post) return null;
                const mappedPost = (post.id && post.author !== undefined) ? post : mapBackendPostToFrontend(post);
                const postId = mappedPost.id || mappedPost.post_id || post.id || post.post_id || `post-${index}`;
                return (
                  <div
                    key={postId}
                    className="w-full max-w-[442px] mx-auto md:mx-0"
                  >
                    <FeedPost
                      {...mappedPost}
                      id={postId}
                      className="!mx-0 !ml-0 w-full max-w-[442px]"
                      returnTo={returnTo}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {posts.length > 0 && results?.posts?.has_more && (
            <SeeAll onClick={() => onSelectCategory('posts')} />
          )}
        </section>
      )}

      {/* Divider */}
      {(posts.length > 0 || results?.posts?.status === 'error') &&
        (hashtags.length > 0 || results?.hashtags?.status === 'error') && (
          <hr className="border-t border-ds-border w-full my-0" />
      )}

      {/* 6. Hashtags Section */}
      {(hashtags.length > 0 || results?.hashtags?.status === 'error') && (
        <section className="w-full flex flex-col items-center px-4 py-4 md:px-0 md:py-0 md:gap-3">
          <SectionTitle>Hashtags</SectionTitle>
          {results?.hashtags?.status === 'error' ? (
            <SearchSectionError title="Hashtags" onRetry={() => onRetryCategory?.('hashtags')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-4 md:gap-4">
              {hashtags.map((tag: any, index: number) => {
                const rawTag = typeof tag === 'string' ? tag : (tag?.tag || tag?.name || '');
                const cleanTag = rawTag.replace(/^#/, '');
                const rawCount =
                  typeof tag === 'object' && tag !== null
                    ? tag.post_count ?? tag.posts_count ?? tag.usage_count ?? 0
                    : 0;
                const count = Number.isFinite(Number(rawCount)) ? Number(rawCount) : 0;
                const displayCount = tag?.posts_display || `${count.toLocaleString()} posts`;

                return (
                  <Link
                    key={`${cleanTag || 'tag'}-${index}`}
                    href={`/hashtag/${encodeURIComponent(cleanTag)}?returnTo=${encodeURIComponent(currentSearchUrl)}`}
                    className="w-full flex flex-col items-start gap-1 py-1 rounded-xl transition-colors group cursor-pointer"
                  >
                    <span className="text-base font-medium font-dm-sans text-ds-text-primary group-hover:text-ds-accent transition-colors">
                      #{cleanTag}
                    </span>
                    <span className="text-xs font-normal font-dm-sans text-ds-text-secondary">
                      {displayCount}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
          {hashtags.length > 0 && <SeeAll onClick={() => onSelectCategory('hashtags')} />}
        </section>
      )}
    </div>
  );
};
