"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  value?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  danger?: boolean;
}

export const SettingRow = React.memo(function SettingRow({
  label,
  description,
  icon,
  value,
  rightElement,
  showChevron = false,
  onClick,
  disabled = false,
  className = '',
  danger = false,
}: SettingRowProps) {
  const isClickable = Boolean(onClick) && !disabled;

  const content = (
    <div
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`flex items-center justify-between gap-4 py-3 transition-colors ${
        isClickable
          ? 'cursor-pointer hover:bg-ds-surface-1/40 active:bg-ds-surface-1/60 focus:outline-none focus-visible:bg-ds-surface-1/50 rounded-lg px-2'
          : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {icon && (
          <div className="shrink-0 text-ds-text-secondary flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <div
            className={`text-base font-medium font-['DM_Sans'] leading-6 truncate ${
              danger ? 'text-ds-error' : 'text-ds-text-primary'
            }`}
          >
            {label}
          </div>
          {description && (
            <div className="text-sm font-normal text-ds-text-secondary font-['DM_Sans'] leading-5 mt-0.5">
              {description}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {value && (
          <div className="text-sm font-normal text-ds-text-muted truncate max-w-[180px] md:max-w-[240px]">
            {value}
          </div>
        )}
        {rightElement}
        {showChevron && (
          <ChevronRight className="w-4 h-4 text-ds-text-muted shrink-0" />
        )}
      </div>
    </div>
  );

  return content;
});
