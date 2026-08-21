import { useState, useRef, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { useAnalyticsStore } from '@/store/analytics.store';

export function serializeDateRange(dateRange?: DateRange): string {
  if (!dateRange) return 'none';
  const start = dateRange.from ? dateRange.from.toISOString().split('T')[0] : 'none';
  const end = dateRange.to ? dateRange.to.toISOString().split('T')[0] : 'none';
  return `${start}_${end}`;
}

export function useAnalyticsFilter() {
  const { filter, dateRange, sortOption, setFilter, setDateRange, setSortOption } = useAnalyticsStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Shared click-outside handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return {
    filter,
    dateRange,
    sortOption,
    setFilter,
    setDateRange,
    setSortOption,
    dropdownOpen,
    setDropdownOpen,
    dropdownRef,
  };
}
