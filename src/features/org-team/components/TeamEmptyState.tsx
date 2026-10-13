'use client';

import React from 'react';
import { Icon } from '@/components/icons';

interface TeamEmptyStateProps {
  onCreateRole: () => void;
}

export default function TeamEmptyState({ onCreateRole }: TeamEmptyStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-8">
      <div className="text-center">
        <p className="ds-text-secondary-1 text-ds-text-primary">
          manage team home page empty
        </p>
      </div>
    </div>
  );
}

