'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchPillChevron } from './SearchPillChevron';
import { SearchCategory } from '../types/search.types';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface CategoryDropdownPillProps {
  currentCategory: SearchCategory;
  onSelectCategory: (category: SearchCategory) => void;
  query?: string;
}

const CATEGORY_ITEMS: { id: SearchCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'people', label: 'People' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'companies', label: 'Company' },
  { id: 'institutes', label: 'Institution' },
  { id: 'posts', label: 'Posts' },
  { id: 'hashtags', label: 'Hashtags' },
];

export const CategoryDropdownPill: React.FC<CategoryDropdownPillProps> = ({
  currentCategory,
  onSelectCategory,
  query = '',
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { isCompany, activeProfile } = useActiveProfile();
  const isOrgActor = Boolean(
    isCompany ||
    activeProfile?.type === 'COMPANY' ||
    (activeProfile as any)?.type === 'ORGANIZATION' ||
    (activeProfile as any)?.type === 'ORG' ||
    activeProfile?.entityType === 'COMPANY' ||
    activeProfile?.entityType === 'INSTITUTION' ||
    (typeof window !== 'undefined' && (() => {
      try {
        const stored = sessionStorage.getItem('cocpit_active_profile');
        if (!stored) return false;
        const p = JSON.parse(stored);
        return p?.type === 'COMPANY' || p?.type === 'ORGANIZATION' || p?.entityType === 'COMPANY' || p?.entityType === 'INSTITUTION';
      } catch {
        return false;
      }
    })())
  );

  const visibleItems = useMemo(() => {
    if (isOrgActor) {
      return CATEGORY_ITEMS.filter((item) => item.id !== 'jobs');
    }
    return CATEGORY_ITEMS;
  }, [isOrgActor]);

  const activeItem = visibleItems.find((c) => c.id === currentCategory) || visibleItems[0];

  const handleSelect = (id: SearchCategory) => {
    setOpen(false);
    onSelectCategory(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center gap-2 px-3 py-1.5 h-9 box-border border border-ds-accent bg-ds-bg rounded-full text-base leading-6 font-medium text-ds-text-primary font-dm-sans cursor-pointer shadow-sm select-none shrink-0"
        >
          <SearchPillChevron open={open} className="text-ds-text-primary" />
          <span className="text-base font-medium leading-6 whitespace-nowrap">
            {activeItem.label}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="p-[12px] w-auto min-w-[90px] bg-ds-bg border border-ds-border rounded-[8px] flex flex-col items-start gap-[16px] shadow-2xl z-[120] focus:outline-none focus:ring-0"
      >
        {visibleItems.map((item) => {
          const isActive = item.id === currentCategory;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`font-dm-sans text-[14px] leading-[20px] font-normal transition-colors cursor-pointer text-left whitespace-nowrap outline-none bg-transparent border-none p-0 ${
                isActive
                  ? 'text-ds-accent'
                  : 'text-ds-text-secondary hover:text-ds-text-primary'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

