import React from 'react';
import { Icon } from '@/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import dayjs from 'dayjs';
import { useAnalyticsFilter } from '../../hooks/useAnalyticsFilter';
import { ANALYTICS_FILTER_OPTIONS, ANALYTICS_FILTER_LABELS } from '../../constants/analytics.constants';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';

interface AnalyticsFilterBarProps {
  title?: React.ReactNode;
  showSort?: boolean;
  allowCustom?: boolean;
}

export function AnalyticsFilterBar({ title, showSort = false, allowCustom = true }: AnalyticsFilterBarProps) {
  const {
    filter,
    dateRange,
    sortOption,
    setFilter,
    setDateRange,
    setSortOption,
    dropdownOpen,
    setDropdownOpen,
    dropdownRef,
  } = useAnalyticsFilter();

  const [sortDropdownOpen, setSortDropdownOpen] = React.useState(false);
  const sortDropdownRef = React.useRef<HTMLDivElement>(null);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [mobileCalendarOpen, setMobileCalendarOpen] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
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
      setCalendarOpen(false);
      setDropdownOpen(!dropdownOpen);
    }
  };

  const filterOptions = React.useMemo(() => {
    return allowCustom !== false
      ? ANALYTICS_FILTER_OPTIONS
      : ANALYTICS_FILTER_OPTIONS.filter((f) => f !== ANALYTICS_FILTER_LABELS.CUSTOM);
  }, [allowCustom]);

  const isCustom = filter === 'Custom' || filter === ANALYTICS_FILTER_LABELS.CUSTOM;

  const dateRangeLabel = React.useMemo(() => {
    if (dateRange?.from) {
      if (dateRange.to) {
        return `${dayjs(dateRange.from).format('MMM DD, YYYY')} - ${dayjs(dateRange.to).format('MMM DD, YYYY')}`;
      }
      return dayjs(dateRange.from).format('MMM DD, YYYY');
    }
    return 'Select Date Range';
  }, [dateRange]);

  return (
    <div className="flex flex-row items-center justify-between py-0 gap-[10px] w-full max-w-[846.67px] h-[24px] mb-6">
      {title && (
        <span className="font-['DM_Sans'] font-semibold text-[16px] leading-[24px] flex items-center text-ds-text-primary flex-1">
          {title}
        </span>
      )}
      
      {!title && <div className="flex-1" />}

      {/* Filter / Custom Date Trigger with Dropdown right after it */}
      <div className="relative flex items-center" ref={dropdownRef}>
        {isMobile ? (
          <div
            className="flex flex-row items-center gap-[6px] cursor-pointer bg-transparent border-none p-0 select-none"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <button
              type="button"
              className="flex flex-row items-center gap-[6px] cursor-pointer bg-transparent border-none p-0 text-ds-text-secondary hover:text-ds-text-primary transition-colors focus:outline-none select-none"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileDrawerOpen(true);
              }}
              title="Select period"
            >
              <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px]">
                {isCustom ? dateRangeLabel : filter}
              </span>
            </button>

            <button
              type="button"
              className="flex items-center justify-center p-0 cursor-pointer bg-transparent border-none text-ds-text-primary focus:outline-none select-none"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileDrawerOpen(true);
              }}
              title="Select period"
            >
              <Icon
                name="chevron-down"
                className={`w-[16px] h-[16px] text-ds-text-primary transition-transform ${mobileDrawerOpen ? 'rotate-180' : ''}`}
                strokeWidth={1.5}
              />
            </button>
          </div>
        ) : (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <div className="flex flex-row items-center gap-[6px] cursor-pointer bg-transparent border-none p-0 select-none">
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex flex-row items-center gap-[6px] cursor-pointer bg-transparent border-none p-0 text-ds-text-secondary hover:text-ds-text-primary transition-colors focus:outline-none select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    setCalendarOpen(false);
                    setDropdownOpen(!dropdownOpen);
                  }}
                  title="Select period"
                >
                  <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px]">
                    {isCustom ? dateRangeLabel : filter}
                  </span>
                </button>
              </PopoverTrigger>

              {/* Dropdown Chevron arrow: right after date / label */}
              <button
                type="button"
                className="flex items-center justify-center p-0 cursor-pointer bg-transparent border-none text-ds-text-primary focus:outline-none select-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setCalendarOpen(false);
                  setDropdownOpen(!dropdownOpen);
                }}
                title="Select period"
              >
                <Icon
                  name="chevron-down"
                  className={`w-[16px] h-[16px] text-ds-text-primary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  strokeWidth={1.5}
                />
              </button>
            </div>

            <PopoverContent
              className="w-[260px] p-0 z-[120] bg-transparent border-0 shadow-2xl"
              align="end"
              side="bottom"
              sideOffset={8}
              onInteractOutside={() => setCalendarOpen(false)}
              onEscapeKeyDown={() => setCalendarOpen(false)}
            >
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (range?.from && range?.to) {
                    setCalendarOpen(false);
                  }
                }}
                numberOfMonths={1}
                captionLayout="dropdown"
                startMonth={new Date(2020, 0)}
                endMonth={new Date(2030, 11)}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Desktop Dropdown Menu - Exact Figma: 130px Hug (Hidden on Mobile) */}
        {!isMobile && dropdownOpen && (
          <div className="absolute top-[32px] right-0 z-50 flex flex-col p-[6px] gap-[2px] w-[130px] min-w-[130px] bg-ds-bg border border-ds-border rounded-[16px] shadow-xl">
            {filterOptions.map((f) => (
              <div
                key={f}
                className={`flex flex-row items-center px-2 py-1 w-full h-[32px] rounded-[10px] cursor-pointer hover:bg-ds-surface-1 transition-colors whitespace-nowrap ${
                  filter === f ? 'text-ds-accent font-medium' : 'text-ds-text-secondary hover:text-ds-text-primary'
                }`}
                onClick={() => {
                  setFilter(f);
                  setDropdownOpen(false);
                  if (f === ANALYTICS_FILTER_LABELS.CUSTOM) {
                    setCalendarOpen(true);
                  } else {
                    setDateRange(undefined);
                    setCalendarOpen(false);
                  }
                }}
              >
                <span className="text-[14px] font-normal font-['DM_Sans'] leading-[20px] truncate">{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Drawer for Filters */}
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerContent className="bg-ds-bg border-t border-ds-border rounded-t-[24px] px-5 pb-8 pt-1 font-['DM_Sans']">
          <DrawerTitle className="sr-only">Select time period</DrawerTitle>

          <div className="flex flex-col gap-1 pt-3 pb-1">
            {filterOptions.map((f) => {
              const isSelected = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFilter(f);
                    setMobileDrawerOpen(false);
                    if (f === ANALYTICS_FILTER_LABELS.CUSTOM) {
                      setMobileCalendarOpen(true);
                    } else {
                      setDateRange(undefined);
                    }
                  }}
                  className={`flex items-center w-full py-3 px-1 transition-colors border-none bg-transparent cursor-pointer text-left font-['DM_Sans'] text-[15px] ${
                    isSelected ? 'text-ds-accent font-medium' : 'text-ds-text-secondary hover:text-ds-text-primary'
                  }`}
                >
                  <span>{f}</span>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mobile Bottom Drawer for Custom Date Calendar */}
      <Drawer open={mobileCalendarOpen} onOpenChange={setMobileCalendarOpen}>
        <DrawerContent className="bg-ds-bg border-t border-ds-border rounded-t-[24px] px-5 pb-8 pt-2 font-['DM_Sans']">
          <DrawerHeader className="px-0 pt-2 pb-4 mb-1 border-b border-ds-border flex flex-row items-center justify-between">
            <DrawerTitle className="text-[18px] font-semibold text-ds-text-primary font-['DM_Sans']">
              Select custom date range
            </DrawerTitle>
            <DrawerClose asChild>
              <button
                type="button"
                className="p-1 rounded-full text-ds-text-secondary hover:text-ds-text-primary focus:outline-none bg-transparent border-none cursor-pointer"
              >
                <Icon name="close" className="w-[18px] h-[18px]" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex justify-center py-4">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                if (range?.from && range?.to) {
                  setMobileCalendarOpen(false);
                }
              }}
              numberOfMonths={1}
              captionLayout="dropdown"
              startMonth={new Date(2020, 0)}
              endMonth={new Date(2030, 11)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
