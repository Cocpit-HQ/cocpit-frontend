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
      <section className="conn-suggestions" aria-label="People you may know">
        <div className="conn-suggestions__header">
          <h2 className="conn-section-title">Suggestions</h2>
        </div>
        <div className="conn-suggestions__grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <SuggestionCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // Gracefully hide the whole section on error or empty
  if (isError || !data?.data?.length) return null;

  return (
    <section className="conn-suggestions" aria-label="People you may know">
      <div className="conn-suggestions__header">
        <h2 className="conn-section-title">Suggestions</h2>
      </div>
      <div className="conn-suggestions__grid">
        {data.data.map((user) => (
          <SuggestionCard key={user.id} user={user} />
        ))}
      </div>
    </section>
  );
}
