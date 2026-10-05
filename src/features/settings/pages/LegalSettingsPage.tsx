"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalItem {
  title: string;
  description: string;
  href: string;
}

const LEGAL_ITEMS: LegalItem[] = [
  {
    title: 'Privacy policy',
    description: 'How we handle your data',
    href: 'https://cocpit.in/privacy-policy',
  },
  {
    title: 'Terms & conditions',
    description: 'Rules for using Cocpit',
    href: 'https://cocpit.in/terms-and-conditions',
  },
  {
    title: 'Community guidelines',
    description: 'Standards for posts and behavior',
    href: 'https://cocpit.in/home',
  },
  {
    title: 'Cookie policy',
    description: 'How we use cookies',
    href: 'https://cocpit.in/home',
  },
];

export function LegalSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/legal';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  return (
    <div className="w-full max-w-[712px] px-2 sm:px-4 py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3">
      {/* Mobile Back Header (visible on mobile only) */}
      <div className="self-stretch inline-flex md:hidden justify-start items-center gap-3 mb-1">
        <button
          type="button"
          onClick={() => router.push(basePath)}
          aria-label="Back to settings menu"
          className="flex items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
        </button>
        <div className="ds-text-body-2 text-ds-text-primary">Legal & Privacy</div>
      </div>

      {/* Legal Items List */}
      <div className="self-stretch flex flex-col justify-start items-start w-full">
        {LEGAL_ITEMS.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title} - ${item.description}`}
            className="self-stretch py-3 border-b border-ds-border last:border-b-0 inline-flex justify-between items-center group cursor-pointer hover:opacity-85 transition-opacity ds-focus-ring"
          >
            <div className="flex-1 min-w-0 pr-2 inline-flex flex-col justify-center items-start">
              <div className="ds-text-body-1 text-ds-text-primary">
                {item.title}
              </div>
              <div className="ds-text-secondary text-ds-text-secondary">
                {item.description}
              </div>
            </div>
            <ChevronRight
              className="w-5 h-5 text-ds-text-primary shrink-0 transition-transform group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default LegalSettingsPage;
