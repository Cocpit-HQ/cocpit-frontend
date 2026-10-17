"use client";

import React from 'react';

interface SettingToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export const SettingToggle = React.memo(function SettingToggle({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  className = '',
}: SettingToggleProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleToggle}
      className={`w-11 h-6 relative flex items-center rounded-[100px] shrink-0 cursor-pointer transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ds-accent select-none ${
        checked ? 'bg-ds-accent' : 'bg-ds-surface-2 border border-ds-border'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      <span
        className={`size-4 absolute left-1 top-1 rounded-full pointer-events-none transform transition-transform duration-150 ease-out will-change-transform ${
          checked
            ? 'translate-x-[20px] bg-black'
            : 'translate-x-0 bg-ds-text-secondary'
        }`}
      />
    </button>
  );
});

