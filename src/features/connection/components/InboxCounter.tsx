'use client';

interface InboxCounterProps {
  count: number;
}

export function InboxCounter({ count }: InboxCounterProps) {
  return (
    <p className="text-[13px] font-medium text-muted-foreground mb-3 tracking-[0.01em]" aria-label={`Inbox — ${count} pending`}>
      Inbox - {count}
    </p>
  );
}
