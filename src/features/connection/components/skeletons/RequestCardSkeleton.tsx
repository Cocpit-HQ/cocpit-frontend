'use client';

export function RequestCardSkeleton() {
  return (
    <div className="flex items-center justify-between py-2 px-4 bg-card min-h-[92px] rounded-xl border-b border-border last:border-b-0 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-3 w-full">
        <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="h-5 bg-muted rounded w-[150px]" />
          <div className="h-4 bg-muted rounded w-[200px]" />
          <div className="h-5 bg-muted rounded w-[80px] mt-1" />
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="h-10 w-[100px] rounded-[24px] bg-muted" />
        <div className="h-10 w-[100px] rounded-[24px] bg-muted" />
      </div>
    </div>
  );
}
