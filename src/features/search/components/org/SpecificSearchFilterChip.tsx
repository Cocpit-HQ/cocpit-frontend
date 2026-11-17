'use client';

import React, { useState, useMemo, KeyboardEvent } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchPillChevron } from '../SearchPillChevron';
import { X } from 'lucide-react';

interface SpecificSearchFilterChipProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  buttonWidthClass?: string;
}

export const SpecificSearchFilterChip: React.FC<SpecificSearchFilterChipProps> = ({
  value,
  onChange,
  buttonWidthClass = 'w-auto',
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const keywords = useMemo(() => {
    if (!value) return [];
    return value.includes('|')
      ? value.split('|').map((k) => k.trim()).filter(Boolean)
      : [value.trim()].filter(Boolean);
  }, [value]);

  const isActive = keywords.length > 0;

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    const exists = keywords.some((k) => k.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setInputValue('');
      return;
    }
    const updated = [...keywords, trimmed];
    onChange(updated.join('|'));
    setInputValue('');
  };

  const removeKeyword = (idx: number) => {
    const updated = keywords.filter((_, i) => i !== idx);
    onChange(updated.length > 0 ? updated.join('|') : undefined);
  };

  const handleClearAll = () => {
    setInputValue('');
    onChange(undefined);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && keywords.length > 0) {
      removeKeyword(keywords.length - 1);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 px-[12px] py-[6px] h-[36px] ${buttonWidthClass} box-border shrink-0 rounded-full transition-all font-dm-sans cursor-pointer select-none ${
            isActive
              ? 'bg-ds-bg border border-ds-accent text-ds-text-primary'
              : 'bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted'
          }`}
        >
          <SearchPillChevron open={open} className="text-ds-text-primary" />
          <span className="text-[16px] font-medium leading-[24px] text-ds-text-primary whitespace-nowrap">
            Specific Search
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[296px] p-3 bg-[#030303] border border-[#2C2C33] rounded-[16px] shadow-2xl flex flex-col gap-4 z-[130] focus:outline-none focus:ring-0 font-dm-sans"
      >
        {/* Input field with bottom border */}
        <div className="w-full flex items-center py-2 border-b border-[#2C2C33]">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) addKeyword(inputValue);
            }}
            placeholder={keywords.length === 0 ? 'Type keyword & press Enter...' : 'Add another keyword...'}
            className="w-full bg-transparent text-[14px] leading-[20px] font-normal font-dm-sans text-[#FFECE6] placeholder:text-[#FFECE6]/40 outline-none"
            autoFocus
          />
        </div>

        {/* Selected Keyword Chips */}
        {keywords.length > 0 && (
          <div className="w-full flex flex-wrap items-center gap-2 max-h-[160px] overflow-y-auto no-scrollbar">
            {keywords.map((kw, idx) => (
              <div
                key={idx}
                className="h-[28px] px-2 py-1.5 rounded-[100px] bg-[#1A1A20] border border-[#EC6229] flex items-center justify-center gap-2 shrink-0 select-none"
              >
                <span className="font-dm-sans text-[12px] leading-[16px] font-normal text-[#FFECE6]">
                  {kw}
                </span>
                <button
                  type="button"
                  onClick={() => removeKeyword(idx)}
                  className="text-[#FFECE6] hover:text-white p-0 bg-transparent border-none cursor-pointer flex items-center justify-center"
                  aria-label={`Remove keyword ${kw}`}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Clear all (bottom right) */}
        {keywords.length > 0 && (
          <div className="w-full flex justify-end">
            <button
              type="button"
              onClick={handleClearAll}
              className="font-dm-sans text-[10px] leading-[12px] font-normal text-[#E5484D] hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0 text-right select-none"
            >
              Clear all
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
