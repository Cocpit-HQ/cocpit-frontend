'use client';

interface InboxCounterProps {
  count: number;
}

export function InboxCounter({ count }: InboxCounterProps) {
  return (
    <p className="conn-inbox-counter" aria-label={`Inbox — ${count} pending`}>
      Inbox - {count}
    </p>
  );
}
