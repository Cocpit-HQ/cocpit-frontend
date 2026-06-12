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
      className="inline-flex items-center gap-3 px-4 py-2 rounded-[24px] border border-[#E0E7FF] bg-white text-[#000000] text-sm font-normal leading-[20px] transition-all duration-200 shadow-[0px_0px_4px_0px_rgba(99,102,241,0.05)] hover:shadow-[0px_0px_8px_0px_rgba(99,102,241,0.1)] hover:border-[#6366F1]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon icon="ri:link" width={24} height={24} className="flex-shrink-0 text-[#6B7280]" />
      <span className="truncate">{suggestion.label}</span>
    </button>
  );
}