'use client';

import { useRouter } from 'next/navigation';
import { useConnectionStore } from '@/store/connection.store';

export function ConnectionHeader() {
  const router = useRouter();
  const { activeTab } = useConnectionStore();

  const title = activeTab === 'received' ? 'Received requests' : 'Sent requests';

  return (
    <header className="flex items-start gap-3 mb-6">
      <button
        className="flex items-center justify-center w-9 h-9 rounded-full border-[1.5px] border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground shrink-0 mt-[2px]"
        onClick={() => router.back()}
        aria-label="Go back to connections"
      >
        &#8249;
      </button>
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Stay update with your account activity
        </p>
      </div>
    </header>
  );
}
