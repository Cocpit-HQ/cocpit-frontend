'use client';

import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { SearchPersonItem } from '../../types/search.types';
import { SearchPersonCard } from '../cards/SearchPersonCard';
import { Loader2 } from 'lucide-react';

interface SearchPeopleViewProps {
  items: SearchPersonItem[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  query: string;
  returnTo?: string;
}

export const SearchPeopleView: React.FC<SearchPeopleViewProps> = ({
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
    return qStr ? `/search?${qStr}` : `/search?q=${encodeURIComponent(query)}&type=people`;
  }, [returnTo, searchParams, query]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!isLoading && items.length === 0) {
    return (
      <div className="w-full max-w-[540px] mx-auto py-16 text-center">
        <h3 className="text-ds-text-primary text-[16px] font-medium leading-[24px] font-dm-sans mb-1">
          {query.trim()
            ? `No people found for \u201C${query}\u201D`
            : 'No people found matching your filters'}
        </h3>
        <p className="text-ds-text-secondary text-[12px] leading-[16px] font-dm-sans">
          {query.trim()
            ? 'Try searching with first name, last name, or account handle.'
            : 'Try adjusting or clearing your filter options.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[540px] mx-auto flex flex-col items-center gap-[12px] px-2 sm:px-0">
      {/* Header */}
      <h2 className="w-full h-[24px] text-[16px] font-medium leading-[24px] text-ds-text-primary text-left font-dm-sans">
        People
      </h2>

      {/* List Wrapper */}
      <div className="flex flex-col items-start gap-[16px] w-full">
        {items.map((person) => (
          <SearchPersonCard
            key={person.id}
            person={person}
            returnTo={currentSearchUrl}
          />
        ))}
      </div>

      {/* Keyset pagination trigger */}
      <div ref={ref} className="w-full py-4 min-h-[40px] flex justify-center items-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-ds-text-secondary text-[12px] font-dm-sans">
            <Loader2 className="size-4 animate-spin text-ds-accent" />
            <span>Loading more people...</span>
          </div>
        )}
      </div>
    </div>
  );
};
