'use strict';
'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Loader2, X } from 'lucide-react';
import { SearchPillChevron } from '../SearchPillChevron';
import { getPaginatedLocations } from '../../services/locationSearch.service';
import { formatJobLocation } from '@/features/jobs/utils/location.utils';
import { v4 as uuidv4 } from 'uuid';

export interface SearchableLocationFilterChipProps {
  selectedValues: string[];
  onToggle: (location: string) => void;
  title?: string;
  widthClass?: string;
  buttonWidthClass?: string;
  zIndexClass?: string;
}

const getNormKey = (s: string) => s.toLowerCase().replace(/_/g, ' ').trim();

/**
 * Unified Location Filter Chip for Global Search (Jobs, People, Companies, Institutions).
 * Features:
 * - Direct visual parity with design system pill and chevron
 * - Live Google Places autocomplete search with debouncing & session token
 * - Infinite scrolling on browse mode
 * - Pinned selected items at top
 * - Highlighting of selected items with text-ds-accent
 */
export const SearchableLocationFilterChip: React.FC<SearchableLocationFilterChipProps> = ({
  selectedValues,
  onToggle,
  title = 'Location',
  widthClass = 'w-auto min-w-[200px] max-w-[320px]',
  buttonWidthClass = 'w-auto',
  zIndexClass = 'z-[130]',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const sessionTokenRef = useRef<string>(uuidv4());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const openSnapshotRef = useRef<string[]>([]);

  const isActive = selectedValues.length > 0;

  // Reset or initialize session token and selections snapshot on open/close
  useEffect(() => {
    if (open) {
      sessionTokenRef.current = uuidv4();
      openSnapshotRef.current = [...selectedValues];
    } else {
      setQuery('');
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
    }
  }, [open]);

  // Initial load or debounced query search
  useEffect(() => {
    if (!open) return;
    let isCurrent = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await getPaginatedLocations(
          query.trim() || undefined,
          undefined,
          15,
          sessionTokenRef.current
        );
        if (isCurrent) {
          setItems(res.items || []);
          setNextCursor(res.nextCursor || null);
          setHasMore(Boolean(res.hasMore));
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  // Infinite scroll listener
  const handleScroll = useCallback(async () => {
    const el = scrollContainerRef.current;
    if (!el || isLoadingMore || !hasMore || !nextCursor) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 25) {
      setIsLoadingMore(true);
      try {
        const res = await getPaginatedLocations(
          query.trim() || undefined,
          nextCursor,
          15,
          sessionTokenRef.current
        );
        setItems((prev) => {
          const prevNorms = new Set(prev.map(getNormKey));
          const newUnique = (res.items || []).filter((i) => !prevNorms.has(getNormKey(i)));
          return [...prev, ...newUnique];
        });
        setNextCursor(res.nextCursor || null);
        setHasMore(Boolean(res.hasMore));
      } catch (err) {
        console.error('Failed to load more locations:', err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, nextCursor, isLoadingMore, query]);

  // Items to display: active selections pinned to top when browsing
  const displayItems = useMemo(() => {
    if (query.trim()) {
      return items;
    }
    const snapshot =
      openSnapshotRef.current.length > 0 ? openSnapshotRef.current : selectedValues;
    const topItems: string[] = [];
    const seenNorm = new Set<string>();

    snapshot.forEach((val) => {
      const cleanVal = formatJobLocation(val) || val;
      const norm = getNormKey(cleanVal);
      if (!norm) return;
      if (!seenNorm.has(norm)) {
        seenNorm.add(norm);
        const matching = items.find((i) => getNormKey(i) === norm);
        topItems.push(matching || cleanVal);
      }
    });

    const bottomItems = items.filter((opt) => !seenNorm.has(getNormKey(opt)));
    return [...topItems, ...bottomItems];
  }, [items, query, selectedValues]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          openSnapshotRef.current = [...selectedValues];
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 px-[12px] py-[6px] h-[36px] ${buttonWidthClass} box-border shrink-0 rounded-full transition-all font-dm-sans cursor-pointer select-none ${
            isActive
              ? 'bg-ds-bg border border-ds-accent text-ds-text-primary'
              : 'bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted'
          }`}
        >
          <SearchPillChevron open={open} className="text-ds-text-primary" />
          <span className="text-[16px] font-medium leading-[24px] text-ds-text-primary whitespace-nowrap">
            {title}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className={`${widthClass} p-4 bg-ds-bg border border-ds-border rounded-[10px] shadow-2xl flex flex-col gap-3 ${zIndexClass} focus:outline-none focus:ring-0`}
      >
        {/* Search input with bottom border */}
        <div className="w-full flex items-center gap-2 border-b border-ds-border pb-1.5 px-0">
          <Search className="size-3.5 text-ds-text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search location"
            className="w-full bg-transparent text-sm text-ds-text-primary placeholder:text-ds-text-muted outline-none font-dm-sans"
            autoFocus
          />
          {isLoading ? (
            <Loader2 className="size-3.5 text-ds-accent animate-spin shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-ds-text-secondary hover:text-ds-text-primary text-xs p-0.5 cursor-pointer bg-transparent border-none"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Scrollable Items List */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-col items-start gap-3.5 max-h-60 overflow-y-auto no-scrollbar py-1 w-full"
        >
          {isLoading && items.length === 0 ? (
            <div className="py-2 text-center text-xs text-ds-text-secondary font-dm-sans w-full">
              Loading locations...
            </div>
          ) : displayItems.length === 0 ? (
            <div className="py-2 text-center text-xs text-ds-text-secondary font-dm-sans w-full">
              No matching locations
            </div>
          ) : (
            displayItems.map((loc) => {
              const isSelected = selectedValues.some(
                (sel) => getNormKey(formatJobLocation(sel) || sel) === getNormKey(loc)
              );
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => onToggle(loc)}
                  className={`w-full text-left font-dm-sans text-sm leading-normal font-normal transition-colors cursor-pointer select-none whitespace-nowrap outline-none bg-transparent hover:bg-transparent border-none p-0 ${
                    isSelected
                      ? 'text-ds-accent font-normal'
                      : 'text-ds-text-secondary hover:text-ds-text-primary'
                  }`}
                >
                  <span className="truncate block py-0.5">{loc}</span>
                </button>
              );
            })
          )}
          {isLoadingMore && (
            <div className="w-full py-1 text-center text-[11px] text-ds-text-secondary font-dm-sans flex items-center justify-center gap-1.5">
              <Loader2 className="size-3 text-ds-accent animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableLocationFilterChip;

