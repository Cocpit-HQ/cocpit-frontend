'use client';

import { Icon } from '@iconify/react';

interface EmptyStateProps {
  title:    string;
  subtitle: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-5 text-center animate-in fade-in"
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      {/* People / connections icon */}
      <Icon icon="ion:people-outline" className="w-20 h-20 text-muted-foreground mb-4" aria-hidden="true" />

      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed">{subtitle}</p>
    </div>
  );
}
