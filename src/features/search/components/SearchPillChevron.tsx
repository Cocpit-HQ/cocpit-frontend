'use client';

import React from 'react';

interface SearchPillChevronProps {
  open?: boolean;
  className?: string;
}

/**
 * Dropdown chevron icon matching exact Figma vector specifications:
 * Width: 11px (11.000556945800781)
 * Height: 6px (6.000670433044434)
 * Top offset: 5.5px
 * Left offset: 2.5px
 * Centered in a 16x16px container
 */
export const SearchPillChevron: React.FC<SearchPillChevronProps> = ({
  open = false,
  className = '',
}) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${
        open ? 'rotate-180' : 'rotate-0'
      } ${className}`}
      aria-hidden="true"
    >
      <path
        d="M2.5 5.5L8 11.5L13.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

