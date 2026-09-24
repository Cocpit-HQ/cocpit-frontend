"use client"

import React from "react";
import type { AISuggestion } from "../../types/ai.types";
import { Icon } from "@iconify/react";

interface AISuggestionChipProps {
  suggestion: AISuggestion;
  onClick: (prompt: string) => void;
  disabled?: boolean;
}

export default function AISuggestionChip({
  suggestion,
  onClick,
  disabled = false,
}: AISuggestionChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(suggestion.prompt)}
      className="inline-flex items-center gap-3 px-4 py-2 rounded-[24px] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm font-normal leading-[20px] transition-all duration-200 shadow-[var(--card-shadow-inner)] hover:shadow-md hover:border-[var(--primary)]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-default"
    >
      <Icon icon="ri:link" width={24} height={24} className="flex-shrink-0 text-[var(--muted-foreground)]" />
      <span className="truncate">{suggestion.label}</span>
    </button>
  );
}