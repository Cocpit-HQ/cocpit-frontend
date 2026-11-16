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

interface SearchAllViewProps {
  data?: StageAResponse;
  query: string;
  onSelectCategory: (category: SearchCategory) => void;
  onRetryCategory?: (category: SearchCategory) => void;
  returnTo?: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="w-full text-base font-medium font-dm-sans text-ds-text-primary">
      {children}
    </h2>
  );
}

function SeeAll({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-full flex justify-center pt-1">
      <button
        type="button"
        onClick={onClick}
        className="flex h-9 items-center justify-center rounded-full bg-ds-surface-1 hover:bg-ds-surface-2 transition-colors px-3 py-[6px] gap-1 cursor-pointer select-none border-none outline-none"
      >
        <span className="text-base font-medium font-dm-sans text-ds-text-primary">See all</span>
        <ChevronRight className="w-4 h-4 text-ds-text-primary shrink-0" />
      </button>
    </div>
  );
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
    <div className="w-full flex items-center justify-between py-2 rounded-2xl transition-colors group">
      <Link href={profileUrl} className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar
          src={person.avatar_url || ''}
          name={person.name}
          className="size-8 rounded-full shrink-0 object-cover"
        />
        <div className="flex flex-col justify-center gap-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0 max-w-[360px] sm:max-w-[400px]">
            <span className="text-sm font-normal font-dm-sans text-ds-text-primary group-hover:text-ds-accent transition-colors shrink-0 max-w-[180px] sm:max-w-[220px] truncate">
              {person.name}
            </span>
            {headline && (
              <>
                <div className="size-1 rounded-full bg-ds-text-muted shrink-0" />
                <span className="text-xs font-normal font-dm-sans text-ds-text-secondary truncate shrink min-w-0 max-w-[200px] sm:max-w-[240px]">
                  {headline}
                </span>
              </>
            )}
          </div>
          {context && (
            <span className="text-xs font-medium font-dm-sans text-ds-text-secondary truncate max-w-[360px] sm:max-w-[400px]">
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
  const salaryText =
    job.salary_display ||
    (job.salary_min && job.salary_max
      ? `₹${job.salary_min}–${job.salary_max}`
      : job.salary_min
      ? `₹${job.salary_min}`
      : job.salary_max
      ? `₹${job.salary_max}`
      : '');

  const experienceText =
    job.experience_label ||
    (job.experience_min !== undefined && job.experience_max !== undefined
      ? `${job.experience_min}-${job.experience_max}Yrs`
      : job.experience_min !== undefined
      ? `${job.experience_min}+ Yrs`
      : '');

  const isApplied = Boolean(job.is_applied || job.hasApplied);

  return (
    <div
      onClick={onClick}
      className="w-full h-[156px] flex flex-col justify-between p-3 gap-3 rounded-2xl border border-ds-border bg-ds-bg box-border hover:border-ds-border-subtle transition-all cursor-pointer group"
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
    <div className="w-full flex items-center justify-between py-2 rounded-2xl transition-colors group">
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
    <div className="w-full flex items-center justify-between py-2 rounded-2xl transition-colors group">
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
  const jobs = results?.jobs?.items || [];
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
    <div className="w-full max-w-[602px] mx-auto px-4 sm:px-0 flex flex-col items-center gap-5 pb-20">
      {/* 1. People Section */}
      {(people.length > 0 || results?.people?.status === 'error') && (
        <section className="w-full flex flex-col items-center gap-3">
          <SectionTitle>People</SectionTitle>
          {results?.people?.status === 'error' ? (
            <SearchSectionError title="People" onRetry={() => onRetryCategory?.('people')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-2">
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
        (jobs.length > 0 || results?.jobs?.status === 'error' || companies.length > 0 || institutes.length > 0 || posts.length > 0 || hashtags.length > 0) && (
          <div className="h-px w-full border-t border-ds-border" />
      )}

      {/* 2. Jobs Section */}
      {(jobs.length > 0 || results?.jobs?.status === 'error') && (
        <section className="w-full flex flex-col items-center gap-3">
          <SectionTitle>Jobs</SectionTitle>
          {results?.jobs?.status === 'error' ? (
            <SearchSectionError title="Jobs" onRetry={() => onRetryCategory?.('jobs')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-3">
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
      {(jobs.length > 0 || results?.jobs?.status === 'error') &&
        (companies.length > 0 || results?.companies?.status === 'error' || institutes.length > 0 || posts.length > 0 || hashtags.length > 0) && (
          <div className="h-px w-full border-t border-ds-border" />
      )}

      {/* 3. Companies Section */}
      {(companies.length > 0 || results?.companies?.status === 'error') && (
        <section className="w-full flex flex-col items-center gap-3">
          <SectionTitle>Companies</SectionTitle>
          {results?.companies?.status === 'error' ? (
            <SearchSectionError title="Companies" onRetry={() => onRetryCategory?.('companies')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-2">
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
          <div className="h-px w-full border-t border-ds-border" />
      )}

      {/* 4. Institutes Section */}
      {(institutes.length > 0 || results?.institutes?.status === 'error') && (
        <section className="w-full flex flex-col items-center gap-3">
          <SectionTitle>Institutes</SectionTitle>
          {results?.institutes?.status === 'error' ? (
            <SearchSectionError title="Institutes" onRetry={() => onRetryCategory?.('institutes')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-2">
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
          <div className="h-px w-full border-t border-ds-border" />
      )}

      {/* 5. Posts Section */}
      {(posts.length > 0 || results?.posts?.status === 'error') && (
        <section className="w-full flex flex-col items-start gap-3">
          <SectionTitle>Posts</SectionTitle>
          {results?.posts?.status === 'error' ? (
            <SearchSectionError title="Posts" onRetry={() => onRetryCategory?.('posts')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-3">
              {posts.map((post: any, index: number) => {
                const mappedPost = post.author ? post : mapBackendPostToFrontend(post);
                return (
                  <div
                    key={mappedPost.id || mappedPost.post_id || `post-${index}`}
                    className="w-full max-w-[442px]"
                  >
                    <FeedPost
                      {...mappedPost}
                      id={mappedPost.id || mappedPost.post_id}
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
          <div className="h-px w-full border-t border-ds-border" />
      )}

      {/* 6. Hashtags Section */}
      {(hashtags.length > 0 || results?.hashtags?.status === 'error') && (
        <section className="w-full flex flex-col items-center gap-3">
          <SectionTitle>Hashtags</SectionTitle>
          {results?.hashtags?.status === 'error' ? (
            <SearchSectionError title="Hashtags" onRetry={() => onRetryCategory?.('hashtags')} />
          ) : (
            <div className="w-full flex flex-col items-start gap-4">
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
