'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalSearchUrlState } from './hooks/useGlobalSearchUrlState';
import { useGlobalSearch } from './hooks/useGlobalSearch';
import { useSearchScrollRestoration } from './hooks/useSearchScrollRestoration';
import { SearchHeaderBar } from './components/SearchHeaderBar';
import { SearchCategoryNav } from './components/SearchCategoryNav';
import { SearchSkeleton } from './components/SearchSkeleton';
import { SearchAllView } from './components/views/SearchAllView';
import { SearchPeopleView } from './components/views/SearchPeopleView';
import { SearchJobsView } from './components/views/SearchJobsView';
import { SearchCompaniesView } from './components/views/SearchCompaniesView';
import { SearchInstitutesView } from './components/views/SearchInstitutesView';
import { SearchPostsView } from './components/views/SearchPostsView';
import { SearchHashtagsView } from './components/views/SearchHashtagsView';
import { SearchCategory } from './types/search.types';

export default function SearchClient() {
  const router = useRouter();
  const {
    q,
    type,
    filters,
    currentSearchUrl,
    setQuery,
    setType,
    toggleFilterArray,
    setFilterValue,
    toggleVerified,
    toggleActivelyHiring,
    clearAllFilters,
    goBackStep,
    exitSearch,
  } = useGlobalSearchUrlState();

  const handleSelectCategory = (newCategory: SearchCategory) => {
    setType(newCategory);
  };

  const {
    isAll,
    allData,
    allLoading,
    allError,
    allRefetch,
    categoryData,
    categoryLoading,
    categoryError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    categoryRefetch,
  } = useGlobalSearch({
    query: q,
    type,
    filters,
  });

  const categoryItems = React.useMemo(() => {
    if (!categoryData?.pages) return [];
    return categoryData.pages.flatMap((page) => page.items || []);
  }, [categoryData]);

  const isReady = isAll ? !allLoading : !categoryLoading;

  const { handleCaptureClick } = useSearchScrollRestoration({
    isReady,
    currentSearchUrl,
    query: q,
    type,
  });

  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans flex flex-col items-center pb-20 relative">
      {/* Fixed Header: Search Bar + Category Navigation & Filters */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full bg-ds-bg flex flex-col items-center">
        <SearchHeaderBar
          initialQuery={q}
          onSearch={setQuery}
          onBack={goBackStep}
          onClose={exitSearch}
          placeholder="Search Cocpit..."
        />

        <SearchCategoryNav
          currentCategory={type}
          onSelectCategory={handleSelectCategory}
          filters={filters}
          onToggleFilter={toggleFilterArray}
          onSetFilter={setFilterValue}
          onToggleVerified={toggleVerified}
          onToggleActivelyHiring={toggleActivelyHiring}
          query={q}
        />
      </header>

      {/* Main Content Area */}
      <main
        onClickCapture={handleCaptureClick}
        className={`w-full flex flex-col items-center ${
          type === 'jobs' ? 'pt-[164px] md:pt-[208px]' : 'pt-[156px]'
        }`}
      >
        {/* If no query is entered yet */}
        {!q.trim() && type === 'all' ? (
          <div className="w-full max-w-[602px] mx-auto px-4 py-20 text-center">
            <h2 className="text-ds-text-primary text-xl font-medium font-dm-sans mb-2">
              Search across Cocpit
            </h2>
            <p className="text-ds-text-secondary text-sm font-dm-sans">
              Find people, jobs, companies, institutes, posts, and trending hashtags.
            </p>
          </div>
        ) : isAll ? (
          /* Multi-Category 'All' View */
          allLoading ? (
            <SearchSkeleton category="all" />
          ) : allError ? (
            <div className="w-full max-w-[602px] mx-auto px-4 py-16 text-center">
              <h3 className="text-ds-text-primary text-base font-medium font-dm-sans mb-2">
                Unable to load search results
              </h3>
              <p className="text-ds-text-secondary text-sm font-dm-sans mb-4">
                Something went wrong while querying search results.
              </p>
              <button
                type="button"
                onClick={() => allRefetch()}
                className="px-4 py-2 rounded-full bg-ds-surface-1 border border-ds-border text-sm font-medium text-ds-text-primary hover:bg-ds-surface-2 transition-colors cursor-pointer"
              >
                Retry Search
              </button>
            </div>
          ) : (
            <SearchAllView
              data={allData}
              query={q}
              onSelectCategory={handleSelectCategory}
              onRetryCategory={(cat) => handleSelectCategory(cat)}
              returnTo={currentSearchUrl}
            />
          )
        ) : categoryLoading ? (
          /* Category Deep-Dive Loading Skeleton */
          <SearchSkeleton category={type} />
        ) : categoryError ? (
          <div className="w-full max-w-[720px] mx-auto px-4 py-16 text-center">
            <h3 className="text-ds-text-primary text-base font-medium font-dm-sans mb-2">
              Failed to load {type}
            </h3>
            <p className="text-ds-text-secondary text-sm font-dm-sans mb-4">
              We encountered an issue fetching {type}
              {q.trim() ? ` for \u201C${q}\u201D` : ''}.
            </p>
            <button
              type="button"
              onClick={() => categoryRefetch()}
              className="px-4 py-2 rounded-full bg-ds-surface-1 border border-ds-border text-sm font-medium text-ds-text-primary hover:bg-ds-surface-2 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : type === 'jobs' ? (
          <SearchJobsView
            items={categoryItems}
            isLoading={categoryLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            onClearFilters={clearAllFilters}
            query={q}
            returnTo={currentSearchUrl}
          />
        ) : type === 'people' ? (
          <SearchPeopleView
            items={categoryItems}
            isLoading={categoryLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            query={q}
            returnTo={currentSearchUrl}
          />
        ) : type === 'companies' ? (
          <SearchCompaniesView
            items={categoryItems}
            isLoading={categoryLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            query={q}
            returnTo={currentSearchUrl}
          />
        ) : type === 'institutes' ? (
          <SearchInstitutesView
            items={categoryItems}
            isLoading={categoryLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            query={q}
            returnTo={currentSearchUrl}
          />
        ) : type === 'posts' ? (
          <SearchPostsView
            items={categoryItems}
            isLoading={categoryLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            query={q}
            returnTo={currentSearchUrl}
          />
        ) : type === 'hashtags' ? (
          <SearchHashtagsView
            items={categoryItems}
            isLoading={categoryLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            query={q}
            returnTo={currentSearchUrl}
          />
        ) : null}
      </main>
    </div>
  );
}
