'use client';

import React from 'react';
import Link from 'next/link';

interface SeeAllLinkProps {
  count: number;
  href: string;
}

export function SeeAllLink({ count, href }: SeeAllLinkProps) {
  if (count <= 3) return null;

  return (
    <div className="flex items-center justify-center w-full py-4 mt-1 select-none">
      {/* Design System Token: text-ds-accent for #EC6229 with no underline */}
      <Link
        href={href}
        className="font-dm-sans text-[12px] sm:text-[13px] font-normal text-ds-accent hover:text-ds-accent !no-underline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm cursor-pointer"
      >
        See all
      </Link>
    </div>
  );
}

export default SeeAllLink;
