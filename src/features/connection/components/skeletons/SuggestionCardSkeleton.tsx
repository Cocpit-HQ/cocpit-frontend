'use client';

export function SuggestionCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-card rounded-[24px] border border-border h-full min-h-[260px] animate-pulse" aria-hidden="true">
      <div className="w-[100px] h-[100px] rounded-full bg-muted mt-2" />
      <div className="h-5 bg-muted rounded w-[120px] mt-2" />
      <div className="h-3 bg-muted rounded w-[150px]" />
      <div className="h-3 bg-muted rounded w-[100px] mt-2" />
      <div className="h-10 w-full rounded-full bg-muted mt-auto" />
    </div>
  );
}
