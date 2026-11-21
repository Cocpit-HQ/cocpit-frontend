import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/icons';
import { ANALYTICS_SORT_OPTIONS, AnalyticsSortOption } from '../../constants/analytics.constants';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';

interface AnalyticsSortDropdownProps {
  value?: string;
  onChange?: (option: AnalyticsSortOption) => void;
  className?: string;
  triggerLabel?: string;
}

export const AnalyticsSortDropdown: React.FC<AnalyticsSortDropdownProps> = ({
  value = 'Top performing',
  onChange,
  className = '',
  triggerLabel = 'Sort by',
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile) {
      setMobileDrawerOpen(true);
    } else {
      setOpen(!open);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleTriggerClick}
        className="flex flex-row items-center gap-[6px] cursor-pointer bg-transparent border-none p-0 text-ds-text-secondary hover:text-ds-text-primary transition-colors focus:outline-none select-none"
        title={triggerLabel}
      >
        <span className="text-[14px] font-normal text-ds-text-secondary font-['DM_Sans'] flex items-center leading-[20px] h-[20px]">
          {triggerLabel}
        </span>
        <Icon
          name="chevron-down"
          className={`w-[16px] h-[16px] text-ds-text-primary transition-transform ${(!isMobile && open) || (isMobile && mobileDrawerOpen) ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
      </button>

      {/* Desktop Dropdown Menu - Exact Figma: Hidden on Mobile */}
      {!isMobile && open && (
        <div className="absolute top-7 right-0 z-50 flex flex-col p-[6px] w-[130px] bg-ds-bg border border-ds-border rounded-[16px] shadow-xl">
          {ANALYTICS_SORT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange?.(option);
                setOpen(false);
              }}
              className={`flex flex-row items-center px-2 py-1 w-full h-[32px] rounded-[10px] cursor-pointer text-left transition-colors border-none bg-transparent ${
                value === option
                  ? 'text-ds-accent font-medium bg-ds-surface-1/50'
                  : 'text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1'
              }`}
            >
              <span className="text-[14px] font-normal font-['DM_Sans'] leading-[20px] truncate">
                {option}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Mobile Bottom Drawer for Sort by */}
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerContent className="bg-ds-bg border-t border-ds-border rounded-t-[24px] px-5 pb-8 pt-1 font-['DM_Sans']">
          <DrawerTitle className="sr-only">Sort posts by</DrawerTitle>

          <div className="flex flex-col gap-1 pt-3 pb-1">
            {ANALYTICS_SORT_OPTIONS.map((option) => {
              const isSelected = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange?.(option);
                    setMobileDrawerOpen(false);
                  }}
                  className={`flex items-center w-full py-3 px-1 transition-colors border-none bg-transparent cursor-pointer text-left font-['DM_Sans'] text-[15px] ${
                    isSelected ? 'text-ds-accent font-medium' : 'text-ds-text-secondary hover:text-ds-text-primary'
                  }`}
                >
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
