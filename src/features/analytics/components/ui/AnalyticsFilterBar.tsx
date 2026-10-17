import React from 'react';
import { Icon } from '@iconify/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import dayjs from 'dayjs';
import { useAnalyticsFilter } from '../../hooks/useAnalyticsFilter';

interface AnalyticsFilterBarProps {
  title?: string;
  showSort?: boolean;
  allowCustom?: boolean;
}

export function AnalyticsFilterBar({ title, showSort = false }: AnalyticsFilterBarProps) {
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

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-row items-center py-0 gap-[10px] w-full h-[26px] mb-6">
      {title && (
        <span className="font-['Poppins'] font-medium text-[18px] leading-[26px] flex items-center text-[#000000] flex-1">
          {title}
        </span>
      )}
      
      {!title && <div className="flex-1" />}

      {/* Filter Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="flex flex-row items-center gap-[8px] cursor-pointer border border-[#EEF2FF] px-3 py-1.5 rounded-full text-xs text-[#6B7280] bg-white hover:bg-gray-50 transition-colors shadow-sm"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className="font-['Poppins'] font-normal">{filter}</span>
          <Icon icon="lucide:chevron-down" className={`w-[16px] h-[16px] text-[#6B7280] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
        </div>

        {dropdownOpen && (
          <div className="absolute top-[36px] right-0 z-50 flex flex-col items-center p-2 w-[135px] bg-white border border-[#EEF2FF] rounded-[16px] shadow-lg">
            {['Last 7 days', 'Last 30 days', 'All time', 'Custom'].map((f) => (
              <div
                key={f}
                className={`flex flex-row items-center px-4 py-2 gap-[10px] w-full h-[32px] rounded-[12px] cursor-pointer hover:bg-[#EEF2FF] transition-colors whitespace-nowrap ${
                  filter === f ? 'text-[#6366F1] font-medium' : 'text-[#6B7280]'
                }`}
                onClick={() => { setFilter(f); setDropdownOpen(false); }}
              >
                <span className="text-[12px] font-['Poppins']">{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Date Range Picker */}
      {filter === 'Custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer border border-[#EEF2FF] px-3 py-1.5 rounded-full text-xs text-[#6B7280] bg-white hover:bg-gray-50 transition-colors shadow-sm ml-2">
              <Icon icon="lucide:calendar" className="w-[16px] h-[16px]" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <span className="font-['Poppins']">
                    {dayjs(dateRange.from).format('MMM DD, YYYY')} - {dayjs(dateRange.to).format('MMM DD, YYYY')}
                  </span>
                ) : (
                  <span className="font-['Poppins']">{dayjs(dateRange.from).format('MMM DD, YYYY')}</span>
                )
              ) : (
                <span className="font-['Poppins']">Pick a date</span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 z-[120] bg-white border border-[#EEF2FF] shadow-lg rounded-[16px]" align="end" side="bottom" sideOffset={8}>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={1}
              captionLayout="dropdown"
              startMonth={new Date(2020, 0)}
              endMonth={new Date(2030, 11)}
              className="bg-white"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
