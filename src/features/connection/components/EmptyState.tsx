'use client';

import { Icon } from '@iconify/react';

interface EmptyStateProps {
  title:    string;
  subtitle: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div
      className="conn-empty"
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      {/* People / connections icon */}
      <Icon icon="ion:people-outline" className="conn-empty__icon" aria-hidden="true" />

      <h3 className="conn-empty__title">{title}</h3>
      <p  className="conn-empty__subtitle">{subtitle}</p>
    </div>
  );
}
