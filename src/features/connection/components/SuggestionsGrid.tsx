'use client';

import { SuggestionCard } from './SuggestionCard';
import { SuggestionCardSkeleton } from './skeletons/SuggestionCardSkeleton';
import { useConnectionSuggestions } from '../hooks/useConnectionSuggestions';

interface SuggestionsGridProps {
  enabled: boolean;
}

export function SuggestionsGrid({ enabled }: SuggestionsGridProps) {
  const { data, isLoading, isError } = useConnectionSuggestions(enabled);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <section className="mt-8" aria-label="People you may know">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Suggestions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SuggestionCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (isError) return null;

  if (!data?.data?.length) {
    return (
      <section className="mt-8" aria-label="People you may know">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Suggestions</h2>
        </div>
        <div className="text-center text-muted-foreground py-5">
          No suggestions available at this time.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8" aria-label="People you may know">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Suggestions</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.data.map((user) => (
          <SuggestionCard key={user.id} user={user} />
        ))}
      </div>
    </section>
  );
}
