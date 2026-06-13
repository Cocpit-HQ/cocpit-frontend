'use client';

import Link from 'next/link';

interface SeeAllLinkProps {
  count: number;
  href: string;
}

export function SeeAllLink({ count, href }: SeeAllLinkProps) {
  if (count <= 3) return null;
  return (
    <div className="flex items-center justify-center w-full h-[52px] bg-card shrink-0">
      <Link href={href} className="text-sm font-medium text-primary hover:text-[#4F46E5] transition">
        See all
      </Link>
    </div>
  );
}
