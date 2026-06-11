'use client';

export function SuggestionCardSkeleton() {
  return (
    <div className="conn-suggest-skeleton" aria-hidden="true">
      <div className="conn-skeleton conn-suggest-skeleton__avatar" />
      <div className="conn-skeleton conn-suggest-skeleton__name"   />
      <div className="conn-skeleton conn-suggest-skeleton__sub"    />
      <div className="conn-skeleton conn-suggest-skeleton__sub2"   />
      <div className="conn-skeleton conn-suggest-skeleton__btn"    />
    </div>
  );
}
