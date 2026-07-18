'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface TeamEmptyStateProps {
  onCreateRole: () => void;
}

export default function TeamEmptyState({ onCreateRole }: TeamEmptyStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-8">
      <div className="text-center">
        <p className="text-black text-sm font-medium font-['Poppins']">
          manage team home page empty
        </p>
      </div>
    </div>
  );
}
