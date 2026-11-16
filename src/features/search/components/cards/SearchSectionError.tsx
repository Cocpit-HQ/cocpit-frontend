'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SearchSectionErrorProps {
  title: string;
  onRetry?: () => void;
}

export const SearchSectionError: React.FC<SearchSectionErrorProps> = ({ title, onRetry }) => {
  return (
    <div className="w-full p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center justify-between gap-3 text-sm font-dm-sans">
      <div className="flex items-center gap-2.5 text-ds-text-secondary">
        <AlertCircle className="size-4 text-destructive shrink-0" />
        <span>Failed to load {title.toLowerCase()} results.</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-ds-surface-1 border border-ds-border hover:bg-ds-surface-2 text-ds-text-primary transition-colors cursor-pointer"
        >
          <RefreshCw className="size-3" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

