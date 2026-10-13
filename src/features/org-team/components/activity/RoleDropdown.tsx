'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/icons';

interface RoleDropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'default' | 'pill';
}

export default function RoleDropdown({
  options,
  value,
  onChange,
  placeholder = 'All roles',
  variant = 'default',
}: RoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div ref={ref} className={`relative ${variant === 'pill' ? 'w-fit' : 'w-full'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={
          variant === 'pill'
            ? 'flex flex-row items-center justify-center px-[12px] py-[6px] gap-[4px] h-[36px] rounded-[100px] bg-ds-surface-1 font-["DM_Sans"] font-medium text-[16px] leading-[24px] text-ds-text-primary hover:brightness-110 transition-colors box-border whitespace-nowrap'
            : 'flex items-center justify-between px-6 h-[50px] rounded-[24px] border border-ds-border bg-transparent ds-text-body text-ds-text-primary hover:border-ds-text-muted transition-colors w-full box-border'
        }
      >
        <span className="text-center truncate">{selectedLabel}</span>
        <Icon
          name="chevron-down"
          className={`ds-icon-16 transition-transform ${
            variant === 'pill' ? 'text-ds-text-primary' : 'text-ds-text-primary'
          } ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div 
          className={
            variant === 'pill'
              ? 'absolute top-[calc(100%+8px)] left-0 flex flex-col justify-center items-start p-[12px] gap-[8px] bg-ds-surface-1 rounded-[8px] z-20 shadow-lg w-auto min-w-full whitespace-nowrap'
              : 'absolute top-[calc(100%+8px)] left-0 w-full min-w-[140px] bg-ds-surface-2 border border-ds-border rounded-[12px] shadow-lg z-20 py-2 max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
          }
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={
                variant === 'pill'
                  ? `w-full text-left font-['DM_Sans'] font-normal text-[14px] leading-[20px] whitespace-nowrap hover:opacity-80 transition-opacity ${
                      value === option.value ? 'text-ds-accent' : 'text-ds-text-secondary'
                    }`
                  : `w-full text-left px-6 py-2.5 ds-text-secondary transition-colors ${
                      value === option.value
                        ? 'text-ds-text-primary bg-ds-surface-1'
                        : 'text-ds-text-secondary hover:bg-ds-surface-1'
                    }`
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

