'use client';

import Link from 'next/link';

interface SeeAllLinkProps {
  count: number;
}

export function SeeAllLink({ count }: SeeAllLinkProps) {
  if (count <= 3) return null;
  return (
    <div className="flex items-center justify-center w-full h-[52px] bg-card shrink-0">
      <Link href="/connections/received" className="text-sm font-medium text-primary hover:text-[#4F46E5] hover:underline transition">
        See all
      </Link>
    </div>
  );
}
