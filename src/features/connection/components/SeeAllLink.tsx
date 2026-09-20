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
      {/* 'See all' link with DM Sans 12px Medium / 16px LH typography and #EC6229 accent text color */}
      <Link
        href={href}
        className="w-[37px] h-[16px] font-dm-sans text-[12px] leading-[16px] font-medium tracking-normal !text-ds-accent flex-none order-2 grow-0 hover:opacity-80 !no-underline transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm cursor-pointer flex items-center justify-center"
      >
        See all
      </Link>
    </div>
  );
}

export default SeeAllLink;
