'use client';

import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { SearchInstituteItem } from '../../types/search.types';
import { SearchInstituteCard } from '../cards/SearchInstituteCard';
import { Loader2 } from 'lucide-react';

interface SearchInstitutesViewProps {
  items: SearchInstituteItem[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  query: string;
  returnTo?: string;
}

export const SearchInstitutesView: React.FC<SearchInstitutesViewProps> = ({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  query,
  returnTo,
}) => {
  const searchParams = useSearchParams();
  const { ref, inView } = useInView({ threshold: 0, rootMargin: '200px' });

  const currentSearchUrl = useMemo(() => {
    if (returnTo) return returnTo;
    const qStr = searchParams?.toString();
    return qStr ? `/search?${qStr}` : `/search?q=${encodeURIComponent(query)}&type=institutes`;
  }, [returnTo, searchParams, query]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!isLoading && items.length === 0) {
    return (
      <div className="w-full max-w-[540px] mx-auto px-4 py-16 text-center">
        <h3 className="text-ds-text-primary text-base font-medium font-dm-sans mb-1">
          {query.trim()
            ? `No institutes found for \u201C${query}\u201D`
            : 'No institutes found matching your filters'}
        </h3>
        <p className="text-ds-text-secondary text-sm font-dm-sans">
          {query.trim()
            ? 'Try searching with an educational institution, university, or college name.'
            : 'Try adjusting or clearing your filter options.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[540px] mx-auto px-2 sm:px-0 flex flex-col gap-4 mt-2">
      <h2 className="text-base font-medium text-ds-text-primary w-full text-left font-dm-sans">
        Institute
      </h2>

      {/* List Items Container */}
      <div className="flex flex-col gap-4 w-full">
        {items.map((institute) => (
          <SearchInstituteCard
            key={institute.id}
            institute={institute}
            returnTo={currentSearchUrl}
          />
        ))}
      </div>

      {/* Keyset pagination trigger */}
      <div ref={ref} className="w-full py-4 min-h-[40px] flex justify-center items-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-ds-text-secondary text-sm font-dm-sans">
            <Loader2 className="size-4 animate-spin text-ds-accent" />
            <span>Loading more institutes...</span>
          </div>
        )}
      </div>
    </div>
  );
};
