"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export interface MobileSettingsHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
}

export function MobileSettingsHeader({ 
  title, 
  onBack, 
  rightElement,
  className = '' 
}: MobileSettingsHeaderProps) {
  const router = useRouter();
  const pathname = usePathname() || '/settings';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.replace(basePath);
    }
  };

  return (
    <div className={`flex md:hidden items-center justify-between w-full px-4 h-6 mb-4 select-none shrink-0 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={handleBack}
          aria-label={`Back from ${title}`}
          className="flex items-center justify-center w-5 h-5 p-0 text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary stroke-[1.5]" />
        </button>
        <h1 className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px] h-6 flex items-center m-0 truncate">
          {title}
        </h1>
      </div>
      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </div>
  );
}

