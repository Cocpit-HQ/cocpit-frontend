'use client';

import React from 'react';
import { Icon } from '@/components/icons';

interface EmptyStateProps {
  title: string;
  subtitle: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-5 text-center animate-in fade-in font-dm-sans select-none"
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div className="w-[56px] h-[56px] flex items-center justify-center mb-4" aria-hidden="true">
        <Icon
          name="connection"
          size={56}
          className="w-[56px] h-[56px] text-ds-text-muted"
          aria-hidden="true"
        />
      </div>
      <h3 className="text-[16px] font-medium text-ds-text-primary mb-1">{title}</h3>
      <p className="text-[14px] leading-[20px] text-ds-text-secondary max-w-[320px]">
        {subtitle}
      </p>
    </div>
  );
}
export default EmptyState;
