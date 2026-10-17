"use client";

import React from "react";

export interface StrengthenChip {
  key: string;
  label: string;
  fieldRef?: string;
}

interface StrengthenProfileChipsProps {
  chips: StrengthenChip[];
  onChipClick: (chip: StrengthenChip) => void;
}

/**
 * A row of pill-shaped chips shown at the top of forms (Add Project, Add Experience, etc.)
 * indicating which optional fields are still unfilled. Clicking a chip scrolls to that field.
 *
 * Chips should be computed by the parent form and disappear reactively as fields are filled.
 */
export function StrengthenProfileChips({ chips, onChipClick }: StrengthenProfileChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-row items-center gap-2 flex-wrap py-2">
      <span className="text-[13px] font-normal text-[#6B7280] leading-[20px] font-[family-name:var(--font-poppins)] whitespace-nowrap">
        Strengthen your profile:
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChipClick(chip)}
          className="flex items-center gap-1 px-3 py-1 rounded-full text-[13px] font-medium leading-[20px] font-[family-name:var(--font-poppins)] transition-colors cursor-pointer bg-[#EEF2FF] text-[#6366F1] hover:bg-[#E0E7FF] border border-[#C7D2FE]"
        >
          <span>+</span>
          <span>{chip.label}</span>
        </button>
      ))}
    </div>
  );
}
