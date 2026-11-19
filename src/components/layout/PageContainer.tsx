'use client';

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  /**
   * Container width:
   * - 'standard': max-w-[800px] (standard Connections & Jobs width)
   * - 'figma-wide': max-w-[846.67px] (Figma design frame width for Analytics)
   * - 'full': max-w-full
   */
  maxWidth?: 'standard' | 'figma-wide' | 'full';
  className?: string;
  innerClassName?: string;
}

/**
 * Standard PageContainer following the shell dimensions of Connection & Jobs pages:
 * - Outer responsive gutters: `px-4 sm:px-6 md:px-8`
 * - Desktop right-sidebar offset: `md:pr-[253px]`
 * - Vertical rhythm: `pt-0 pb-6 sm:pb-8 md:pb-10`
 * - Design system tokens from `newGlobal.css`
 */
export function PageContainer({
  children,
  maxWidth = 'figma-wide',
  className = '',
  innerClassName = '',
}: PageContainerProps) {
  const maxWidthClass =
    maxWidth === 'standard'
      ? 'max-w-[800px]'
      : maxWidth === 'figma-wide'
      ? 'max-w-[846.67px]'
      : 'max-w-full';

  return (
    <div
      className={`w-full min-h-screen bg-ds-bg text-ds-text-primary font-['DM_Sans'] px-4 sm:px-6 md:px-8 pt-0 pb-6 sm:pb-8 md:pb-10 md:pr-[253px] ${className}`}
    >
      <div className={`w-full ${maxWidthClass} mx-auto ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}
export default PageContainer;
