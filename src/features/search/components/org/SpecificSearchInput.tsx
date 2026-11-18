'use client';

import React, { useState, KeyboardEvent, useMemo } from 'react';
import { X } from 'lucide-react';

interface SpecificSearchInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

export const SpecificSearchInput: React.FC<SpecificSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Type keyword & press Enter...',
}) => {
  const [inputValue, setInputValue] = useState('');

  const keywords = useMemo(() => {
    if (!value) return [];
    return value.includes('|')
      ? value.split('|').map((k) => k.trim()).filter(Boolean)
      : [value.trim()].filter(Boolean);
  }, [value]);

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
    <div className="w-full flex flex-col gap-4 font-dm-sans">
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
          placeholder={keywords.length === 0 ? placeholder : 'Add another keyword...'}
          className="w-full bg-transparent text-[14px] leading-[20px] font-normal font-dm-sans text-[#FFECE6] placeholder:text-[#FFECE6]/40 outline-none"
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

      {/* Clear all */}
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
    </div>
  );
};
