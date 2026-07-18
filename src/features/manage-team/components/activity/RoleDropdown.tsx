'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface RoleDropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RoleDropdown({
  options,
  value,
  onChange,
  placeholder = 'All roles',
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F1115] text-sm text-gray-700 dark:text-gray-300 font-['Poppins'] hover:border-gray-300 dark:hover:border-gray-600 transition-colors min-w-[120px]"
      >
        <span className="flex-1 text-left truncate">{selectedLabel}</span>
        <Icon
          icon="lucide:chevron-down"
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[140px] bg-white dark:bg-[#1A1D24] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 max-h-[200px] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm font-['Poppins'] transition-colors ${
                value === option.value
                  ? 'text-[#1A73E8] dark:text-[#4D9CFF] bg-[#EFF4FF] dark:bg-[#1A2435]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0F1115]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
