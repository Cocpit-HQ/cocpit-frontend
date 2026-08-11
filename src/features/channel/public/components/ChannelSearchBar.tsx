'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import * as channelService from '../../services/channel.service';

export interface ChannelSearchBarProps {
  initialQuery?: string;
  filterParam?: string;
  placeholder?: string;
  containerClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
  onFilterClick?: () => void;
  showFilterIcon?: boolean;
}

export function ChannelSearchBar({
  initialQuery = '',
  filterParam = 'All',
  placeholder = 'Search',
  containerClassName = 'w-full flex flex-row items-center justify-between px-[16px] py-[8px] border border-black dark:border-white rounded-[24px] h-[36px]',
  inputClassName = 'w-full bg-transparent outline-none text-black dark:text-white text-[12px] font-normal font-["Poppins"] leading-[16px] placeholder:text-black/60 dark:placeholder:text-white/60',
  iconClassName = 'text-black dark:text-white shrink-0 ml-[10px]',
  onFilterClick,
  showFilterIcon = false,
}: ChannelSearchBarProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<{ text: string; kind: 'channel' | 'article'; url: string }[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const debouncedSuggestionQuery = useDebounce(searchInput, 250);

  useEffect(() => {
    setSearchInput(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (debouncedSuggestionQuery.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    setSuggestionsLoading(true);
    Promise.all([
      channelService.searchChannels(debouncedSuggestionQuery).catch(() => []),
      channelService.searchArticles(debouncedSuggestionQuery, 1, 5).catch(() => []),
    ]).then(([channels, articles]) => {
      const channelSuggestions = channels.slice(0, 4).map((c) => ({
        text: c.name,
        kind: 'channel' as const,
        url: `/channels/${c.id}`
      }));
      const articleSuggestions = articles.slice(0, 4).map((a) => ({
        text: a.title,
        kind: 'article' as const,
        url: `/channels/${a.channelId}/article/${a.id}`
      }));
      const merged: { text: string; kind: 'channel' | 'article'; url: string }[] = [];
      const maxLen = Math.max(channelSuggestions.length, articleSuggestions.length);
      for (let i = 0; i < maxLen && merged.length < 6; i++) {
        if (channelSuggestions[i]) merged.push(channelSuggestions[i]);
        if (articleSuggestions[i] && merged.length < 6) merged.push(articleSuggestions[i]);
      }
      setSuggestions(merged);
      setHighlightedIndex(-1);
    }).finally(() => setSuggestionsLoading(false));
  }, [debouncedSuggestionQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = useCallback((item: {text: string; url?: string}) => {
    setSearchInput(item.text);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    if (item.url) {
      router.push(item.url);
    } else {
      const params = new URLSearchParams();
      params.set('q', item.text);
      if (filterParam !== 'All') params.set('filter', filterParam);
      router.push(`/channels/search?${params.toString()}`);
    }
  }, [filterParam, router]);

  const handleSearchSubmit = (query: string) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (filterParam !== 'All') params.set('filter', filterParam);
    router.push(`/channels/search?${params.toString()}`);
    setShowSuggestions(false);
  };

  return (
    <div className="flex-1 relative flex items-center gap-3 w-full" ref={suggestionRef}>
      <div className={containerClassName}>
        <input
          type="text"
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (searchInput.trim().length >= 1) setShowSuggestions(true);
          }}
          onKeyDown={(e) => {
            if (!showSuggestions || suggestions.length === 0) {
              if (e.key === 'Enter') handleSearchSubmit(e.currentTarget.value);
              return;
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex((i) => Math.max(i - 1, -1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlightedIndex >= 0) {
                selectSuggestion(suggestions[highlightedIndex]);
              } else {
                handleSearchSubmit(e.currentTarget.value);
              }
            } else if (e.key === 'Escape') {
              setShowSuggestions(false);
              setHighlightedIndex(-1);
            }
          }}
          className={inputClassName}
        />
        <svg 
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" 
          className={`${iconClassName} cursor-pointer`}
          onClick={() => handleSearchSubmit(searchInput)}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {showFilterIcon && onFilterClick && (
        <button
          onClick={onFilterClick}
          className="w-[24px] h-[24px] shrink-0 flex items-center justify-center text-black dark:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M7 12h10" />
            <path d="M10 18h4" />
          </svg>
        </button>
      )}

      {/* Dropdown */}
      {showSuggestions && searchInput.trim().length >= 1 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] bg-white dark:bg-[#1C2333] border border-[#E5E7EB] dark:border-[#2A2D35] rounded-[16px] shadow-xl overflow-hidden">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleSearchSubmit(searchInput);
            }}
            className={`w-full flex items-center gap-[12px] px-[16px] py-[10px] hover:bg-[#F9FAFB] dark:hover:bg-[#232D3F] transition-colors ${
              highlightedIndex === -1 ? 'bg-[#F9FAFB] dark:bg-[#232D3F]' : ''
            }`}
          >
            <div className="w-[32px] h-[32px] rounded-full bg-[#EEF2FF] dark:bg-[#1e1b4b] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <span className="text-black dark:text-white text-[14px] font-medium font-['Poppins'] flex-1 text-left truncate">
              {searchInput}
            </span>
            <span className="text-[#6B7280] dark:text-[#A1A8B3] text-[11px] font-['Poppins'] shrink-0">
              Search
            </span>
          </button>

          {suggestionsLoading ? (
            <div className="px-[16px] py-[12px] flex gap-2 items-center">
              <div className="w-4 h-4 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#6B7280] text-[13px] font-['Poppins']">Loading...</span>
            </div>
          ) : (
            suggestions.map((s, idx) => (
              <button
                key={idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(s);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full flex items-center gap-[12px] px-[16px] py-[10px] transition-colors ${
                  highlightedIndex === idx
                    ? 'bg-[#F3F4F6] dark:bg-[#232D3F]'
                    : 'hover:bg-[#F9FAFB] dark:hover:bg-[#1e2436]'
                }`}
              >
                <div className="w-[32px] h-[32px] rounded-full bg-[#F3F4F6] dark:bg-[#2A2D35] flex items-center justify-center shrink-0">
                  {s.kind === 'channel' ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                </div>
                <span className="text-black dark:text-white text-[14px] font-normal font-['Poppins'] flex-1 text-left truncate">
                  {s.text}
                </span>
                <span className={`text-[10px] font-semibold font-['Poppins'] px-[8px] py-[2px] rounded-full shrink-0 ${
                  s.kind === 'channel'
                    ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[#6366F1] dark:text-[#818CF8]'
                    : 'bg-[#F0FDF4] dark:bg-[#052e16] text-[#16A34A] dark:text-[#4ade80]'
                }`}>
                  {s.kind === 'channel' ? 'Channel' : 'Article'}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
