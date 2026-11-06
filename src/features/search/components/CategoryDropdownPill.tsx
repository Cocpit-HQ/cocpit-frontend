'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchPillChevron } from './SearchPillChevron';
import { SearchCategory } from '../types/search.types';

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

  const activeItem = CATEGORY_ITEMS.find((c) => c.id === currentCategory) || CATEGORY_ITEMS[0];

  const handleSelect = (id: SearchCategory) => {
    setOpen(false);
    onSelectCategory(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center gap-2 px-[12px] py-[6px] h-[36px] box-border border border-ds-accent bg-ds-bg rounded-full text-[16px] leading-[24px] font-medium text-ds-text-primary font-dm-sans cursor-pointer shadow-sm select-none shrink-0"
        >
          <SearchPillChevron open={open} className="text-ds-text-primary" />
          <span className="text-[16px] font-medium leading-[24px] whitespace-nowrap">
            {activeItem.label}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="p-[12px] w-auto min-w-[90px] bg-ds-bg border border-ds-border rounded-[8px] flex flex-col items-start gap-[16px] shadow-2xl z-[120] focus:outline-none focus:ring-0"
      >
        {CATEGORY_ITEMS.map((item) => {
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
