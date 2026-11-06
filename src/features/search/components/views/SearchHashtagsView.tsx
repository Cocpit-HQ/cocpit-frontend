'use client';

import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { SearchHashtagItem } from '../../types/search.types';
import { SearchHashtagCard } from '../cards/SearchHashtagCard';
import { Loader2 } from 'lucide-react';

interface SearchHashtagsViewProps {
  items: SearchHashtagItem[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  query: string;
  returnTo?: string;
}

export const SearchHashtagsView: React.FC<SearchHashtagsViewProps> = ({
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
    return qStr ? `/search?${qStr}` : `/search?q=${encodeURIComponent(query)}&type=hashtags`;
  }, [returnTo, searchParams, query]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!isLoading && items.length === 0) {
    return (
      <div className="w-full max-w-[488px] mx-auto px-4 py-16 text-center">
        <h3 className="text-ds-text-primary text-base font-medium font-dm-sans mb-1">
          {query.trim()
            ? `No hashtags found for \u201C${query}\u201D`
            : 'No hashtags found'}
        </h3>
        <p className="text-ds-text-secondary text-sm font-dm-sans">
          Try searching with or without the &lsquo;#&rsquo; symbol.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[488px] mx-auto px-2 sm:px-0 flex flex-col gap-3 mt-2">
      <h2 className="text-base font-medium text-ds-text-primary w-full text-left font-dm-sans">
        Hashtags
      </h2>

      {/* List Items Container */}
      <div className="flex flex-col gap-1 w-full divide-y divide-ds-border/40">
        {items.map((hashtag, idx) => (
          <SearchHashtagCard
            key={`${hashtag.id || hashtag.tag}-${idx}`}
            hashtag={hashtag}
            returnTo={currentSearchUrl}
          />
        ))}
      </div>

      {/* Keyset pagination trigger */}
      {fetchNextPage && (
        <div ref={ref} className="w-full py-4 min-h-[40px] flex justify-center items-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-ds-text-secondary text-sm font-dm-sans">
              <Loader2 className="size-4 animate-spin text-ds-accent" />
              <span>Loading more hashtags...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
