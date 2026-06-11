'use client';

import Link from 'next/link';

interface SeeAllLinkProps {
  count: number;
}

export function SeeAllLink({ count }: SeeAllLinkProps) {
  if (count <= 3) return null;
  return (
    <div className="conn-see-all-row">
      <Link href="/connections/received" className="conn-see-all-text">
        See all
      </Link>
    </div>
  );
}
