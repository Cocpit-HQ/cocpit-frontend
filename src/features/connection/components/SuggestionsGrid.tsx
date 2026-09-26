'use client';

import React from 'react';
import { SuggestionCard } from './SuggestionCard';
import { SuggestionCardSkeleton } from './skeletons/SuggestionCardSkeleton';
import { useConnectionSuggestions } from '../hooks/useConnectionSuggestions';
import { useConnectionStore } from '@/store/connection.store';
import { Loader2 } from 'lucide-react';

interface SuggestionsGridProps {
  enabled: boolean;
}

export function SuggestionsGrid({ enabled }: SuggestionsGridProps) {
  const {
    suggestions,
    isLoading,
    isFetching,
    isError,
    hasMore,
    fetchNextBatch,
  } = useConnectionSuggestions(enabled);
  const { dismissedSuggestionIds } = useConnectionStore();

  if (!enabled) return null;

  if (isLoading) {
    return (
      <section className="mt-6" aria-label="People you may know">
        <h2 className="font-dm-sans text-[16px] font-medium leading-[24px] text-ds-text-primary mb-5">
          People you may know
        </h2>
        <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SuggestionCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (isError) return null;

  const filteredSuggestions = suggestions.filter(
    (user) => !dismissedSuggestionIds.has(user.id)
  );

  if (!filteredSuggestions.length && !hasMore) {
    return null;
  }

  return (
    <section className="mt-6" aria-label="People you may know">
      <h2 className="font-dm-sans text-[16px] font-medium leading-[24px] text-ds-text-primary mb-5">
        People you may know
      </h2>

      <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6">
        {filteredSuggestions.map((user) => (
          <SuggestionCard key={user.id} user={user} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={fetchNextBatch}
            disabled={isFetching}
            className="h-[36px] px-5 py-1.5 rounded-full text-[14px] font-medium font-dm-sans bg-ds-surface-1 border border-ds-border text-ds-text-primary hover:border-ds-accent hover:text-ds-accent transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent flex items-center gap-2"
          >
            {isFetching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-ds-text-primary" />
                <span>Loading recommendations...</span>
              </>
            ) : (
              <span>Show more recommendations</span>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
export default SuggestionsGrid;
