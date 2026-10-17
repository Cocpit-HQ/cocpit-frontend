'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export function ConnectionHeader() {
  const router = useRouter();

  return (
    <div className="mb-4 font-dm-sans select-none">
      <button
        type="button"
        onClick={() => router.push('/connections')}
        className="inline-flex items-center gap-1 text-ds-text-primary hover:text-ds-accent transition-colors font-dm-sans text-[13px] sm:text-[14px] font-normal cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm py-1"
        aria-label="Back to connections"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back</span>
      </button>
    </div>
  );
}

export default ConnectionHeader;
