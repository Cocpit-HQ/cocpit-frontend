"use client";

import React from "react";
import { FilterIcon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ChatFilterOption = "All" | "Group" | "Unread" | "Groups";

interface ChatFilterDropdownProps {
  value: ChatFilterOption;
  onChange: (value: ChatFilterOption) => void;
}

const FILTER_OPTIONS: { label: string; value: ChatFilterOption }[] = [
  { label: "All", value: "All" },
  { label: "Group", value: "Group" },
  { label: "Unread", value: "Unread" },
];

export function ChatFilterDropdown({ value, onChange }: ChatFilterDropdownProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex justify-center items-center p-1 rounded-md text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-1)] transition-colors outline-none cursor-pointer"
          title={`Filter: ${value}`}
          aria-label="Filter conversations"
        >
          <FilterIcon size={16} className="w-4 h-4 text-[var(--ds-text-primary)]" />
        </button>
      </DropdownMenuTrigger>
      {/* Frame: Filter - width: 71px, height: 116px, padding: 12px, gap: 16px, background: #030303, border: 1px solid #2C2C33, border-radius: 8px */}
      <DropdownMenuContent
        id="chat-filter-dropdown"
        align="end"
        sideOffset={6}
        className="chat-filter-menu box-border flex flex-col items-start p-3 gap-4 w-[71px] min-w-[71px] max-w-[71px] h-[116px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-lg !shadow-none z-[100] outline-none overflow-hidden"
      >
        {FILTER_OPTIONS.map((opt) => {
          const isSelected =
            value === opt.value || (opt.value === "Group" && value === "Groups");
          return (
            <DropdownMenuItem
              key={opt.value}
              className={`chat-filter-item !p-0 m-0 h-5 w-auto font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start flex-none grow-0 ${
                isSelected
                  ? "active-filter-item !text-[var(--ds-accent)]"
                  : "!text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)]"
              }`}
              onSelect={() => onChange(opt.value)}
            >
              {opt.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
